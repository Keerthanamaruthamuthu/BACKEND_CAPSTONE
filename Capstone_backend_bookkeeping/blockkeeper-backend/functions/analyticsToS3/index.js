const CsvExport = require('dynamodbexportcsv')
let exporter = new CsvExport(process.env.AKEY, process.env.SKEY, 'us-east-1')

exports.handle = function (e, ctx) {
  exporter.exportTable('bk_analytics', ['userid', 'lastTs'], 1, false, 500, 'backup-dynamo-analytics', `${new Date().getMonth() + 1}-${new Date().getDate()}`, function (err) {
    if (err) {
      console.log(err)
      return ctx.fail()
    }
    ctx.succeed()
  })
}
