//jshint esversion:6

require('dotenv').config(); //requring dotenv module for env file
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var _ = require('lodash');

const app = express();

//setting ejs 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connecting to moongoose and creating database 
mongoose.connect(process.env.MONGO_URI); //MONGO_URI contains url to connect to mongodb in a .env <environmental varible file> 
const { Schema } = mongoose;

//creating a new schema
const itemsSchema = new Schema ({
name: String
});

//creating a model for itemsSchema
const Item = mongoose.model("Item", itemsSchema);

//new items
const item1 = new Item({
  name:"Welcome to your todolist!"
});

const item2 = new Item({
  name:"Hit the + button to add a new item"
});

const item3 = new Item({
  name:"<--Hit this to delete an item"
});

//defaultItems array which contains default starting items
const defaultItems = [item1, item2, item3];

 
//listsSchema
const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});

//lists model for listsSchema
const List = mongoose.model("list", listSchema);

//=============================================================================================================

//getting home route
app.get("/", function(req, res) {

//finding items from mongodb
  Item.find({}).then(function(foundItems){

  //if the founditems array in mongodb = 0 it inserts item from defaultitems array
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(()=>{
        console.log("items inserted");
      }).catch((err)=>{
        console.log(err);
      });
      //redirects to home get route and finds the founditems array is not 0 but contains items
      res.redirect("/");
    }else{
      //if founditems array contains items it render this below
res.render("list", {listTitle: "Today", newListItems: foundItems});
    } 
  }).catch((err)=>{
    console.log(err);
  });


});

//----------------------------------------------------------------------------------------------------

//getting dynamic route
app.get("/:customListname", (req, res)=>{

  //the name we enter in browser after localhost "/work" or "/home"
  const customListname = _.capitalize(req.params.customListname);

  //finds lists in lists collection
  List.findOne({name:customListname}).then((foundList)=>{
  //if there are no lists found <"! indicates if not found"> creates a new list 
    if (!foundList) {
  //creates a list with name of the <route> user entered in the browser and adds <defaultItems> array as items    
      const list = new List({
        name:customListname,
        items: defaultItems
        
      });
  //saves the new list
      list.save();
  //redirects to the dynamic route that user entered in the browser if user entered a new <route> it creates a newlist  
      res.redirect("/" + customListname );
    }else{
  //if there is a List found with a name that is equal to <route> name that user entered
  //below statement renders that list "<foundList.name === the list name>" "<foundList.items === list items>"
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }}).catch((err)=>{
      console.log(err);
    });


  });
  
//-----------------------------------------------------------------------------------------------------------

//posting to the home route
app.post("/", function(req, res){

  //TEXT user entered in a form in home page
  const itemName = req.body.newItem;

  //Value added to button which is <listtitle> and it is dynamic in ejs file
  //Below the "<listname>" is a constant which is binded to the button named "list" which also contains
  //a value of <listtitle> which as mentioned above is dynamic
  const listName = req.body.list;

  //adding the Text entered in the form as new item in mongodb items collection
  const item = new Item({
    name: itemName
  });

//if the listname value is "Today" or <listtitle> is "Today" or if user is in home route it saves the newly entered text and 
//redirects to home route 
  if(listName === "Today"){
    
    item.save();

    res.redirect("/");
  }else{
  //else if the user is not in <home route> and is in <Custom route>
  //this code bellow finds the doucment in "lists collection" with the name that matches the value of "<listname>"  
    List.findOne({name:listName}).then(foundList=>{
  //after finding it pushes the newly entered text to the doucments array of items and saves the new item    
      foundList.items.push(item);
      foundList.save();
  //then redirects to custom route where the user began to add new item which is same as the value of <listname>    
      res.redirect("/" + listName);
    }).catch((err)=>{
      console.log(err);
    });
  }



});

//---------------------------------------------------------------------------------------------------------

//posting to delete route
app.post("/delete", (req, res)=>{

//input obtained from list.ejs form with a value binded to it that is id of the item in items collection
//in mongodb
const deleteItemid = req.body.deleteItem;

//input value of <listTitle> binded to it which is dynamic meaning it changes when an action is performed 
//this input has a type hidden
const listName = req.body.listName;

//if the <listName> name is "Today"
if (listName === "Today") {
//find the id of the item from items collection in mongodb and delete them and redirect to home page
  Item.findByIdAndDelete(deleteItemid).then(()=>{
    console.log("deleted item");
    res.redirect("/");
  }).catch((err)=>{
    console.log(err);
  });
//else if <listname> value is not "Today"
//find the document in lists collection in mongodb whose name is equal to <listName>
//then inside that documents "items array" pull the item and delete the item who's "id = <deleteItemid>"
//then after deleteing the item redirect to custom page whose path is same as <listName>
} else {
  List.findOneAndUpdate({name:listName}, {$pull: {items: {_id:deleteItemid}}}).then(result =>{
    res.redirect("/" + listName);
  }).catch(err =>{
    console.log(err);
  });
}


});

//----------------------------------------------------------------------------------------------------------


//getting about route
app.get("/about", function(req, res){
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});

// List.findByIdAndDelete({_id:"64132bba030d8433056d9bd1"}).then(()=>{
//   console.log("deleted");
// }).catch((err)=>{
//   console.log(err);
// });

