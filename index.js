// const express = require("express"); // "type": "commonjs"
import express from "express"; // "type": "module"
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import cors from "cors"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import {auth} from "./auth.js"
import { ObjectId } from "mongodb";
dotenv.config();
const app = express();
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL);
await client.connect();//call
console.log("mongo is connected");
app.use(express.json());
app.use(express.urlencoded({extended:false}))
// app.use(express.urlencoded({extended:true}));
app.use(cors());
const PORT = 4000;
app.get("/", function (request, response) {
  response.send("🙋‍♂️, 🌏 🎊✨🤩");
});
app.post("/workers",async(request,response)=>{
  try{
 const data=request.body;
 const result=await client.db("test").collection("worker").insertMany(data);
 response.send(data);
  }
  catch(error){
  response.send("error")
  }
})
app.post("/projects",async(request,response)=>{
  try{
 const data=request.body;
 const result=await client.db("test").collection("projects").insertMany(data);
 response.send(data);
  }
  catch(error){
  response.send("error")
  }
})
app.get("/workers",async(request,response)=>{
const result=await client.db("test").collection("worker").find({}).toArray();
response.send(result);
})
const ROLE_ID={
  ADMIN:"0",
  NORMAL_USER:"1",
};
app.delete("/projects/:id",auth,async(request,response)=>{
  const id=request.params;
  const {roleId}=request;
  console.log(roleId)
  if(roleId==ROLE_ID.ADMIN){
  const mobiles=await client.db("test").collection("projects").deleteOne({_id:new ObjectId(id)});
  mobiles.deletedCount> 0 ?response.send({message:"project deleted sucessfully"}):response.send({message:"Project not found"});
  } 
  // response.send(result);
  else{
     
    response.status(401).send({message:`Unauthorized`})
    
  }
})
app.put("/workers/:id", async function (request, response) {
  const { id } = request.params;
  const data = request.body;
  const movie = await updateMovieById(id, data)
  response.send(movie)
});
app.delete("/workers/:id",auth,async(request,response)=>{
  const id=request.params;
  const {roleId}=request;
  console.log(roleId)
  if(roleId==ROLE_ID.ADMIN &&request.params){
    request.params=+request.params;
  const result=await client.db("test").collection("worker").deleteOne({_id:new ObjectId(id)})
  result.deletedCount> 0 ?response.send({message:"User deleted sucessfully"}):response.send({message:"User not found"});
  console.log(id);
} 
else{  
  response.status(401).send({message:`Unauthorized`}) 
}
})
app.post("/signup", async (request, response) => {
  const {username,password} = request.body;
  
  // console.log(data);
  // const movie = await postMovies(data);
  const userFromDB=await getUserByName(username);
  console.log(userFromDB);
  if(userFromDB){
    response.status(401).send({message:"username already exits"})
  }
  else if(password.length<8){
response.send({message:"password must be at 8 character"})
  }
  else{
    const hashpassword=await generateHashPassword(password);
    const result=await createUser({
      username:username,
      password:hashpassword,
  // default all user roleId set by one
      roleId:1,
    })
     response.send(result);
  }
  
})
app.post("/login", async (request, response) => {
  const {username,password} = request.body;
  // console.log(data);
  // const movie = await postMovies(data);
  const userFromDB=await getUserByName(username);
  console.log(userFromDB);
  if(!userFromDB){
    response.status(401).send({message:"Invalid data"})
  }
  else{
    const storedDBPassword=userFromDB.password;
    const isPasswordCheck=await bcrypt.compare(password,storedDBPassword)
    console.log(isPasswordCheck);
  
  if(isPasswordCheck){
    const token=jwt.sign({id:userFromDB._id},process.env.SECRET_KEY);
    console.log(token);
    response.send({message:"SucessFul login",token:token,roleId:userFromDB.roleId});
  }
  else{
    response.status(401).send({message:"invalid data"});
  }
}
  
})

app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
export async function generateHashPassword(password){
  const NO_ROUND=10;
   const salt= await bcrypt.genSalt(NO_ROUND);
   const hashpassword= await bcrypt.hash(password,salt);
   console.log(salt);
   console.log(hashpassword);
return hashpassword;
}
export async function createUser(data) {
  console.log(data);
  return await client.db("test").collection('members').insertOne(data);
}
export async function getUserByName(username) {
  return await client.db("test").collection("members").findOne({username:username});
}
export async function getMovieById(id) {
  console.log(id);
  return await client
    .db("test")
    .collection("workers")
    .findOne({ id:id});
}
export async function updateMovieById(id, data) {
  return await client
      .db("test")
      .collection("worker")
      .updateOne({ _id:new ObjectId(id) }, { $set: data });
}
