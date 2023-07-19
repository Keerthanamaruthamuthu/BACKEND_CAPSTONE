const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tscTypesAllowed = ['hd', 'std', 'man']

exports.handle = function (e, ctx) {
  if (validate(e.headers['x-user-id'], 4) === false) {
    return ctx.fail('Invalid userid supplied')
  }
  if (!e.body || !e.body.addresses || Array.isArray(e.body.addresses) === false || e.body.addresses.length > 25) {
    return ctx.fail('Invalid body supplied')
  }
  const puts = []
  let itemError = false
  e.body.addresses.forEach((i) => {
    if (
        validate(i._id, 4) !== true ||
        i.tscs.length > 100 ||
        tscTypesAllowed.indexOf(i.type) === -1
    ) {
      itemError = true
    }
    const putItem = {
      PutRequest: {
        Item: {
          _id: {
            S: i._id
          },
          userid: {
            S: e.headers['x-user-id']
          },
          data: {
            M: {
              addData: {S: i.data.addData},
              tagSize: {N: i.data.tagSize.toString()},
              cypher: {L: i.data.cypher.map(i => { return {'N': i.toString()} })},
              iv: {L: i.data.iv.map(i => { return {'N': i.toString()} })}
            }
          },
          type: {
            S: i.type
          }
        }
      }
    }
    if (i.tscs.length > 0) {
      putItem.PutRequest.Item.tscs = {
        L: i.tscs.map(i => {
          return {
            M: {
              addData: {S: i.addData},
              tagSize: {N: i.tagSize.toString()},
              cypher: {L: i.cypher.map(i => { return {'N': i.toString()} })},
              iv: {L: i.iv.map(i => { return {'N': i.toString()} })}
            }
          }
        })
      }
    }
    puts.push(putItem)
  })
  if (itemError === true) {
    return ctx.fail('Invalid body supplied')
  }
  dynamodb.batchWriteItem({
    RequestItems: {
      'bk_addresses': puts
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE'
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Error')
    }
    if (result && Object.keys(result.UnprocessedItems).length !== 0) {
      return ctx.fail('Error UnprocessedItems')
    }
    ctx.succeed()
  })
}
