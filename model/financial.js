let mongoose = require('mongoose');
let db = mongoose.createConnection(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DB}?authSource=admin`, { useNewUrlParser: true })

var BalanceSchema = new mongoose.Schema({
  uid: String,
  value: Number,
  updated_at: { type: Date, default: Date.now },
});
var TransActions = new mongoose.Schema({
  date :  String,
  description : String,
  amount : Number,
  issuer : String,
  type   : String,
  user_id : String,
  uid : String,
  tag    : String
  });

let mexports = {
  balance : db.model('balance', BalanceSchema),
  Clonebalance : db.model('myblcs', BalanceSchema),
  TransActions : db.model('transaction', TransActions)
}
module.exports = mexports;