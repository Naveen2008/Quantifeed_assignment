let fileName = 'QF0023_SRE_FIX.09-Jan-2018.log'

var fs = require('fs');
const { count } = require('console');
var array = fs.readFileSync(fileName).toString().split("\n");

let validDataCount=0;
let inValidDataCount=0;
let inValidData =[];

let allData = [];
for(let i in array) {
  const line = array[i];
  if(line.startsWith("8=FIX.4.4")){
    validDataCount++;
    const tokens = line.split("|");
    let rowData = {};
    for(let t in tokens){
      const data = tokens[t].split("=");
      if(data.length != 2){
        continue;
      }
      const key = data[0];
      const val = data[1];
      if(key == '55'){
        rowData.code=val;
      }else if(key == '32'){
        rowData.transactionQuantity = val;
      }else if(key == '31'){
        rowData.price = val;
      }else if(key == '54'){
        rowData.side = (val=='1')?'Buy':'Sell';
      }else if(key == '1'){
        rowData.account = val;
      }else if(key == '11'){
        rowData.transactionRefId = val;
      }else if(key == '52'){
        rowData.transactionTime = val;
      }else if(key == '6'){
        rowData.avgPrice = val;
      }else if(key == '151'){
        rowData.leftQty = val;
      }else if(key == '14'){
        rowData.sumQty = val;
      }else if(key == '150'){
        rowData.position = (val=='F')?'closed':'';
      }
    }

    if(rowData.transactionRefId != null){
      allData.push(rowData);
    }
  }else{
    inValidDataCount++;
    inValidData.push(line);
  }
}

console.log("total lines="+array.length)
console.log("validDataCount="+validDataCount);
console.log("ignored the below inValidDataCount="+inValidDataCount);
console.log(inValidData);

let csvContent = 'Stock Code,Transaction Quantity,Transaction Price,Transaction Side,Account,Transaction Reference ID,Transaction Time\n';
for(let i in allData){
  let rowData = allData[i];
  csvContent += rowData.code + ',' + rowData.transactionQuantity + ',' + rowData.price + ','
            + rowData.side + ',' + rowData.account + ',' + rowData.transactionRefId + ','
            + rowData.transactionTime
            + '\n';
}
fs.writeFileSync('executed.csv', csvContent);

let stockCodeVsTransaction = new Map();
for(let i in allData){
  let rowData = allData[i];
  if(!stockCodeVsTransaction.has(rowData.code)){
    rowData.totalQuantity = rowData.transactionQuantity;
    stockCodeVsTransaction.set(rowData.code, rowData);
  }else{
    let existingStockData = stockCodeVsTransaction.get(rowData.code);
    rowData.totalQuantity = parseInt(rowData.transactionQuantity) + parseInt(existingStockData.totalQuantity);

    stockCodeVsTransaction.set(rowData.code, rowData);
  }
}

csvContent = 'Stock Code,Account,Total Quantity,Transaction Side,Transaction Reference ID,Transaction Time\n';
stockCodeVsTransaction.forEach((v,k)=>{
  let rowData = v;
  csvContent += rowData.code + ',' + rowData.account + ',' + rowData.totalQuantity + ',' 
            + rowData.side + ',' + rowData.transactionRefId + ',' + rowData.transactionTime
            + '\n';
});
fs.writeFileSync('order.csv', csvContent);


csvContent = 'Order Id, Account, Stock Code, Last Quantity, Left Quantity, Cum Quantity, Avg Price, Last Price, Side, Position\n';
stockCodeVsTransaction.forEach((v,k)=>{
  let rowData = v;
  csvContent += rowData.transactionRefId + ',' + rowData.account + ',' + rowData.code + ',' 
                + rowData.transactionQuantity + ',' + rowData.leftQty + ',' + rowData.totalQuantity + ',' 
                + rowData.avgPrice + ',' + rowData.price + ',' + rowData.side + ',' + rowData.position
            + '\n';
});
fs.writeFileSync('account_position.csv', csvContent);

console.log('all the csv file have been prepared successfully!');

