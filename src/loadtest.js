const loadtest = require('loadtest');

const server = process.env.P9_SERVER_URL || "{=testUrl}";
const token = process.env.P9_SERVER_TOKEN || "{=testToken}"


let UdateNumEntries = 0;
let globalResult = null;

function statusCallback(error, response, result) {

    globalResult = result;

    UdateNumEntries++;

    //console.log('Request index: ', result.requestIndex);
    //console.log('Request elapsed milliseconds: ', result.requestElapsed);
    if (UdateNumEntries === 100) {
        //console.log(result.requestIndex);
        UdateNumEntries = 0;
        console.log(globalResult);

    }

    if (response && response.statusCode !== 200) console.log(response.statusCode);
    if (error) console.log(error);
}

const options = {
    url: `${server}/api/functions/Performance/Run`,
    maxRequests: 500,
    //maxSeconds: 30,
    //requestsPerSecond: 0,
    concurrency: 50,
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`
    },
    statusCallback: statusCallback
};

loadtest.loadTest(options, function(error, result, latency) {

    if (error) {
        return console.error('Got an error: %s', error);
    }

    console.log('Result', result);
});
