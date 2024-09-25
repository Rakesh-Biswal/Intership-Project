
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');


dotenv.config();

const app = express();


app.use(cors({
    origin: '*' 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


let bucket;

try {
    const serviceAccount = require('./firebaseServiceAccount.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "gs://workwave-8cd56.appspot.com",
    });

    bucket = admin.storage().bucket();

    console.log('✅ Firebase Initialized');
} catch (err) {
    console.error('❌ Firebase Initialization Error:', err);
    process.exit(1);
}

mongoose.connect("mongodb+srv://rakesh:rakesh@cluster0.whvrl2y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });


const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, JPG, and PNG images are allowed!'));
    }
});


const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    type: String,
    whatYouWant: String,
    price: Number,
    productUsed: Number,
    warrantyStatus: String,
    donationOrg: String,
    pickupDateTime: Date,
    location: String,
    photoURL: String,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});


const Product = mongoose.model('Product', productSchema);

app.post('/api/products', upload.single('productPhoto'), async (req, res) => {
    const { productTitle, productDescription, productType, whatYouWant, donationOrg, pickupDateTime, price, productUsed, warrantyStatus, location } = req.body;

    try {
        
        const blob = bucket.file(Date.now() + path.extname(req.file.originalname));
        const blobStream = blob.createWriteStream({
            resumable: false
        });

        blobStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ success: false, message: 'Image upload failed.' });
        });

        blobStream.on('finish', async () => {
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;

            
            const newProduct = new Product({
                title: productTitle,
                description: productDescription,
                type: productType,
                whatYouWant,
                price,
                productUsed,
                warrantyStatus,
                donationOrg,
                pickupDateTime,
                location,
                photoURL: publicUrl
            });

            const savedProduct = await newProduct.save();
            res.status(200).json({ success: true, message: 'Product submitted successfully.', id: savedProduct._id }); // Send ID back
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred.' });
    }
});


app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        console.log(product);
        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred.' });
    }
});




// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
