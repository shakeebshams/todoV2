//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-shams:MkU2oIT1H5IHLm7y@cluster0-r3liw.mongodb.net/todolistDB", {useNewUrlParser: true})

const itemSchema = {
  name: String
};

const Item = mongoose.model(
  "Item",
  itemSchema
);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: " <-- hit this to delete"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res) {
  const day = date.getDate();


  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("successfully added items")
          }
        });
        
        res.redirect('/');
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  })
});





app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === 'Today') {
    item.save()
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, found) {
      found.items.push(item);
      found.save()
      res.redirect('/' + listName);
    });
  }
});


app.post('/delete', function(req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully deleted!");
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: itemId}}},
      function(err, found) {
        if (!err) {
          res.redirect('/' + listName);
        }
      }

    );
  }

})


app.get("/about", function(req, res){
  res.render("about");
});


app.get('/:customListName', function(req, res) {
  const route = _.capitalize(req.params.customListName);

  List.findOne({name: route}, function(err, found) {
    if (!err) {
      if (found) {
        console.log("exists");
        res.render('list', {listTitle: found.name, newListItems: found.items})
      } else {
        console.log("doesnt exist");
        const list = new List({
          name: route,
          items: defaultItems
        })
        list.save();
        res.redirect('/' + route);
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port: " + port);
});
