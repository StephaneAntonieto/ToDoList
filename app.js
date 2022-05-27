const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// Use ejs view templates
app.set("view engine", "ejs");

// Make the app access data from html posts
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Add static files like css and other to use
app.use(express.static(__dirname + "/public"));

// Conection with mongoDB
// mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://user:password@cluster0.hmbef.mongodb.net/todolistDB");

// Create a Schema for DB types
const itemsSchema = {
  name: String
}

const listSchema = {
  name: String,
  items: [itemsSchema]
}

// Create a collection of items from the above schematic template
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Respirar!"
});

const defaultItem = [item1];

// Main webpage route
app.get("/", function (req, res) {

  Item.find({}, (err, item) => {

    if (item.length === 0) {
      Item.insertMany(defaultItem, function (err) {
        if (err) {
          console.error(err.message);
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: item
      });
    }
  })
})

// Create several collections according to the path passed after the url root /
// and add them to the database
app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function (err, list) {
    if (!err) {
      if (!list) {
        const list = new List({
          name: customListName,
          items: defaultItem
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render("list", {
          listTitle: list.name,
          newListItems: list.items
        })
      }
    }
  });

})

// Get the content of the post request, create an item according
// to the schema used and insert it into the database
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({
      name: listName
    }, function (err, list) {
      list.items.push(item);
      list.save();
      res.redirect('/' + listName);
    })
  }
});

// Delete item if the checkbox is checked and return to home page
app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  // Look in the db find the item with the correct id of checkbox marked and delete
  if (listName === "Today") {
    Item.findByIdAndRemove(itemId, function (err, itemId) {
      if (err) {
        console.error(err);
      } else {
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndRemove({
      name: listName
    }, {
      $pull: {
        items: {
          _id: itemId
        }
      }
    }, function (err, list) {
      if (!err) {
        res.redirect('/' + listName);
      }
    })
  }
})

// Server up
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000
}

app.listen(port, () => {
  console.log("Server started.");
});
