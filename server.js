require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const { port, document_id } = require('./config');
const { authentication } = require('./util');

const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MAX_RESULTS_LENGTH = 20;

app.get('/', (req, res) => {
  return res.render('index', { showForm: true, showTableRes: false });
});

app.post('/', async (req, res) => {
  try {
    let { name = '', phone = '' } = req.body;

    const { sheets } = await authentication();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: document_id,
      range: 'sheet1',
    });
    name = name.replace(/-/g, ' ').replace(/[^a-zA-Z ]/g, '');
    phone = phone.replace(/[^a-zA-Z ]/g, '');
    const results = [];
    for (let i = 1; i < data.values.length; i++) {
      const nameSearch = new RegExp(`${name}`, 'gi');
      const phoneSearch = new RegExp(`${phone}`, 'gi');
      const nameMatch = data.values[i][0].search(nameSearch);
      const phoneMatch = data.values[i][1].search(phoneSearch);
      if (nameMatch > -1 && phoneMatch > -1) {
        results.push({
          name: data.values[i][0],
          phone: data.values[i][1],
        });
      }
      // always return only 20 closest match.
      if (results.length === MAX_RESULTS_LENGTH) break;
    }
    return res.render('index', {
      showForm: false,
      showTableRes: true,
      results,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
});

app.listen(port, () => console.log(`Server running on PORT ${port}`));
