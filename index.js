require('dotenv').config();
const express = require('express');
const cors = require('cors');
const url = require('url'); 
const dns = require('node:dns');
const mongoose = require('mongoose')

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded( { extended: false } ))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// DATABASE
try {
  mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.rjheeqq.mongodb.net/?retryWrites=true&w=majority`);
} catch(err) {
  console.error(err);
}



// ROUTES

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// todo: Save URL when URL is new
// todo: Return short_url id if URL already exists
app.post('/api/shorturl', function(req, res) {
  const original_url = req.body.url;
  let url_hostname = url.parse(original_url).hostname;
  url_hostname = url_hostname.replace(/www./, ''); // remove the "www." at the beginning of the url

  let response = {};

  dns.lookup(url_hostname, function(err, address, family)  {
    // Respond invalid url when Hostname is unreachable
    if (err) {
      response.error = 'invalid url'
      res.json(response);
      return;
    };

    response.original_url = original_url;
    response.short_url = '??'
    res.json(response);
    return
  });

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
