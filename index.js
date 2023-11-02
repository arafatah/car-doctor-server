const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dokkyfc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("bookings");


    // Auth related api
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});


      res
      .cookie('token', token, {
        httpOnly:true,
        secure: false,
        // sameSite: 'none',
        
      })
      .send({success: true});
    })

    // Services related api 
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const options = {
        projection: { title: 1, service_id: 1, price: 1, img: 1 },
      };
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });

    // Bookings
    app.get("/bookings", async (req, res) =>{
      console.log(req.cookies.token);
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })

    app.post("/bookings", async (req, res)=>{
      const bookings = req.body;
      console.log(bookings);
      const result = await bookingCollection.insertOne(bookings);
      res.send(result);
    })

    app.patch('/booking/:id', async (req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updateBooking = req.body;
      const updateDoc = {
        $set: updateBooking
      }
      console.log(updateBooking, updateDoc);
      const result = await bookingCollection.updateOne(query, updateDoc);
      res.send(result);
    })


    app.delete("/bookings/:id", async (req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Doctor is ready to serve you!");
});

app.listen(port, () => {
  console.log(`Doctor is running on port:${port}`);
});
