const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { JsonWebTokenError } = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// medawar
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.SECRET_KEY}@cluster0.p45io4t.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const VerifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization ;
  if(!authorization){
    return res.status(401).send({error: true , message: "UnAuthorization Access"})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRETE ,(error,decoded)=>{
    if(error){
      return res.status(403).send({error: true, message:"UnAuthorization Access"})
    }
    req.decoded = decoded
    next()
  } )
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollation = client.db("carDoctor").collection("services");
    const bookingCollation = client.db("carDoctor").collection("booking");



    // services routes 

    app.get("/services", async (req, res) => {
      const cursor = servicesCollation.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result = await servicesCollation.findOne(query);
      res.send(result);
    });

    // jwt routs

    app.post('/jwt',(req , res )=>{
      const user = req.body
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRETE ,{expiresIn: '10h'})
      res.send({token})
    })

    // bookings routs 

    app.get("/bookings", VerifyJWT , async (req, res) => {
      console.log('come back to booking ')
      const decoded = req.decoded ;
      if(decoded !== req.query.email){
        return res.status(403).send({error: 1 , message: 'This Email Data You Not Access'})
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const result = await bookingCollation.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollation.insertOne(booking);
      res.send(result);
    });

    app.patch("/bookings/:id", async (req, res) => {
      const update = req.body;
      const id = req.params.id
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status:update.status
        },
      };
      const result = await bookingCollation.updateOne(filter, updateDoc)
      res.send(result)
    });


    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollation.deleteOne(query);
      res.send(result);
    });

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
  res.send("Hello Car Doctor ");
});

app.listen(port, () => {
  console.log("Car Doctor Server Is Running Port : " + port);
});
