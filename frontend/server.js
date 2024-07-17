const express=require("express");
const mongoose=require("mongoose");
const app=express();
const PORT=process.env.PORT|| 2020;
require('dotenv').config();
const nodemailer=require("nodemailer");
const ejsLay=require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const url=process.env.mongostring;
const bcrypt=require("bcryptjs");

app.use(cookieParser());
app.use(ejsLay);
app.set("layout","layout/header");
app.set("view engine" ,"ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({extended:false}));

const connection=async()=>{
    try{
        await mongoose.connect(url);
        console.log("Mongodb is successfully connected");
    }catch(err){
        console.log(err);
    }
}
connection();

const UserRegister=new mongoose.Schema({
    name:String,
    age:Number,
    phone:Number,
    email:String,
    password:String,
    confirmpassword:String,
})

const Userdata=new mongoose.Schema({
    name:String,
    subject:String,
    data:String,
    email:String,
})

const Usermails=mongoose.model("Usermails",Userdata);

const Mail=mongoose.model("Mail",UserRegister);

app.get("/",(req,res)=>{
    res.render("frontend",{message:" "});
})

app.get("/login",(req,res)=>{
    res.render("login",{message:" "});
})

app.post("/login",async(req,res)=>{
   const {name,email,password}=req.body;
   console.log(name);
   const user=await Mail.findOne({
    name,
    email,
   })
   console.log(user);
   if(user && await bcrypt.compare(password,user.password)){
    res.cookie("UserData",JSON.stringify(user),
        {
            maxAge:3*24*60*1000,
            httpOnly:true,
            secure:false,
            sameSite:"strict",
        });
    res.render("dashboard",{name:name,message:" ",content:"sent",email:email});
   }
   else{
    res.render("login",{message:"Invalid Credentials"});
   }
})

app.get("/dashboard",(req,res)=>{
    const usercookie=req.cookies.UserData?JSON.parse(req.cookies.UserData):null;
    console.log(usercookie);
    const name=usercookie?usercookie.name:null;
    const email=usercookie?usercookie.email:null;
    console.log(name);
    if(name){
        res.render("dashboard",{name:name ,message:" ",content:"sent",email:email});
    }
    else{
        res.render("login",{message:"Please Login First"});
    }
})

app.get("/logout",(req,res)=>{
    const usercookie=req.cookies.UserData?JSON.parse(req.cookies.UserData):null;
    if(usercookie){
        res.clearCookie("UserData");
        res.render("frontend",{message:"Logged out successfully"});
    }
    else{
        res.render("login",{message:"First Login"});
    }
})

app.get("/register",(req,res)=>{
    res.render("register",{message:" "});
})

app.post("/register",async(req,res)=>{
    const{name,age,phone,email,password,confirmpassword}=req.body;
    const userfound =await Mail.findOne({
        email,
    });
    if(userfound){
        res.render("register",{message:"Email-Id Already exist"});
    }
    else{
        const hashpassword=await bcrypt.hash(password,10);
        await Mail.create({
            name,
            age,
            phone,
            email,
            password:hashpassword,
            confirmpassword:hashpassword,
        })
        res.redirect("/login");
    }
})

app.get("/compose",(req,res)=>{
    res.render("compose" ,{layout:false});
});

app.get("/sent",async(req,res)=>{
    const usercookie=req.cookies.UserData?JSON.parse(req.cookies.UserData):null;
    const useremail=usercookie?usercookie.email:null;
    const users=await Usermails.find({
        email:useremail,
    })
    console.log(users);
    res.render("sent", {mail:"hello riya",layout : false, users:users});
})

app.post("/compose",async (req,res)=>{
    const usercookie=req.cookies.UserData?JSON.parse(req.cookies.UserData):null;
    console.log(usercookie);
    const name=usercookie?usercookie.name:null;
    const useremail=usercookie?usercookie.email:null;
    const{email,subject,textarea}=req.body;
    const username1=process.env.key1;
    const password1=process.env.key2;
    try{
        try{
            const transport=nodemailer.createTransport({
                host:"smtp.gmail.com",
                port : 587,
                secure:false,
            auth: {
                user:`${username1}`,
                pass:`${password1}`,
            },
             })
            
             const message={
                from:`${name} riyajadhav1803@gmail.com`,
                to: email,
                subject: subject,
                html:`
                         <h3>You received mail from nodemailer</h3>
                         <p>${textarea}</p>`
             };
             await transport.sendMail(message);
             console.log("message sent");
             const userdata= await Usermails.create({
                name:name,
                subject:subject,
                data:textarea,
                email:useremail,
            })
            console.log(userdata);
            console.log("data saved in database");
             res.render("dashboard",{name:name,message:"Email sent successfully !",content:" ",email:useremail});
        }
        catch(err){
            console.log(err);
            res.render("dashboard",{name:name,message:"Email not sent !",content:" " , email:useremail});
            throw new Error("could not send mail");
        }

    }catch(err){
        console.log(err);
    }
})

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})
