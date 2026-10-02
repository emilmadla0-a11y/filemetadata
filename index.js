// Madla, Emilson Lio F.
// WD-303
var express = require('express');
var cors = require('cors');
require('dotenv').config()

var app = express();

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function readUpload(req) {
  var contentType = req.headers['content-type'] || '';
  var match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!match || !Buffer.isBuffer(req.body)) return null;

  var boundary = Buffer.from('--' + (match[1] || match[2]));
  var body = req.body;
  var pos = body.indexOf(boundary);

  while (pos !== -1) {
    var next = body.indexOf(boundary, pos + boundary.length);
    if (next === -1) break;

    var part = body.slice(pos + boundary.length + 2, next - 2);
    var headerEnd = part.indexOf('\r\n\r\n');

    if (headerEnd !== -1) {
      var headers = part.slice(0, headerEnd).toString('utf8');
      var content = part.slice(headerEnd + 4);
      var fieldName = headers.match(/name="([^"]*)"/);
      var fileName = headers.match(/filename="([^"]*)"/);
      var fileType = headers.match(/content-type:\s*([^\r\n]+)/i);

      if (fieldName && fieldName[1] === 'upfile' && fileName) {
        return {
          name: fileName[1],
          type: fileType ? fileType[1].trim() : 'application/octet-stream',
          size: content.length
        };
      }
    }
    pos = next;
  }
  return null;
}

app.post(
  '/api/fileanalyse',
  express.raw({ type: 'multipart/form-data', limit: '50mb' }),
  function (req, res) {
    var file = readUpload(req);
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json(file);
  }
);

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});