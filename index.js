require('dotenv').config();
const express = require('express');
const cors = require('cors');
const url = require('url'); 
const dns = require('node:dns');
const mongoose = require('mongoose')
const shortId = require('shortid')
const validUrl = require('valid-url')

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

// TODO: Implement caching of URLs using Hashmap??


// DATABASE
try {
  mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.rjheeqq.mongodb.net/fcc?retryWrites=true&w=majority`);
} catch(err) {
  console.error(err);
}

const urlSchema = new mongoose.Schema({
  "original_url": String,
  "short_url": {type: String, unique: true},
});

const urlModel = mongoose.model('URL', urlSchema);



// ROUTES

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


/** 
 * Route /api/shorturl/<short_url> fetches URL with <short_url> as key
 * TODO: When you visit /api/shorturl/<short_url>, you will be redirected to the original URL.
 * @param short_url The route parameter identifies a unique string linked to a URL 
*/
app.get('/api/shorturl/:short_url', function(req, res) {
  const requestUrl = req.params.short_url;
  let response = {};

  urlModel.findOne({ "short_url": requestUrl }).exec()
    .then(
      (foundUrl) => {
        if (foundUrl) {
          res.redirect(foundUrl.original_url);
        } else {
          res.json( {"error": "No short URL found for the given input"} );
        }
    })
    .catch(
      (err) => {
        console.error(err);
      }
    )
});


// todo: Save URL when URL is new
// todo: Return short_url id if URL already exists
app.post('/api/shorturl', function(req, res) {
  let response = {};

  const original_url = req.body.url;
  let url_hostname = url.parse(original_url).hostname;

  // Validate URL string if proper
  if (!validUrl.isWebUri(original_url)) {
    
    response.error = 'invalid url'
    res.json(response);
    return;
  }

  url_hostname = url_hostname.replace(/www./, ''); // remove the "www." at the beginning of the url

  // Check if register in DNS
  dns.lookup(url_hostname, function(err, address, family)  {
    // Respond invalid url when Hostname is unreachable
    if (err) {
      response.error = 'invalid url'
      res.json(response);
      return;
    };

    // Save to database and Return saved content
    // Check first if url already exists within database
    urlModel.findOne({ "original_url": original_url }).exec()
      .then(
        (foundUrl) => {
          if (foundUrl) {
            response.original_url = foundUrl.original_url;
            response.short_url = foundUrl.short_url;
          }
          else {
            const newUrl = new urlModel({
              "original_url": original_url,
              "short_url": shortId.generate(),
            })
            response.original_url = newUrl.original_url;
            response.short_url = newUrl.short_url;
            newUrl.save()
          }
        }
      )
      .catch(
        (err) => {
          console.error(err);
        }
      )
      .finally(
        () => res.json(response)
      );

    return
  });

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
