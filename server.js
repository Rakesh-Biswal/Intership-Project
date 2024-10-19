
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
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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

    description: String,
    price: Number,
    photoURL: String,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});


const Product = mongoose.model('Product', productSchema);

app.post('/api/products', upload.single('productPhoto'), async (req, res) => {
    const {productDescription, price} = req.body;

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
                description: productDescription,
                price,
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


app.get('/api/search/product', async (req, res) => {
    try {
        // Fetch all workers and return only the profession field
        const workers = await Product.find({}, 'description');

        // Extract professions and flatten into a single array, splitting by commas
        const professions = workers
            .map(worker => worker.description)
            .join(',')
            .split(',')
            .map(prof => prof.trim())
            .filter(prof => prof.length > 0);

        // Remove duplicates
        const uniqueProfessions = [...new Set(professions)];

        res.status(200).json({ professions: uniqueProfessions });
    } catch (error) {
        console.error('❌ Failed to fetch professions:', error);
        res.status(500).json({ message: 'Failed to retrieve professions.' });
    }
});
 


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

 