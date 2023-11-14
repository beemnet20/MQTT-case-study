const urlParams = new URLSearchParams(window.location.search)
const myTopic = urlParams.get('topic')
const url = urlParams.get('url')

const uuid = () => {
    var temp_url = URL.createObjectURL(new Blob())
    var uuid = temp_url.toString()
    URL.revokeObjectURL(temp_url)
    return uuid.substr(uuid.lastIndexOf('/') + 1)
}

const remoteMonitorOptions = {
    // Clean session
    clean: true,
    connectTimeout: 4000,
    // Authentication
    clientId: `remote-monitor-client-${uuid()}`,
    username: 'remote-monitor',
    password: 'remote-monitor',
}

const remoteMonitorClient = mqtt.connect(url, remoteMonitorOptions)

remoteMonitorClient.subscribe(myTopic, { qos: 0 }, function (error, granted) {
    if (error) {
        console.log(error)
    } else {
        console.log(
            `remoteMonitorClient subscribed to topic ${granted[0].topic}`
        )
    }
})

remoteMonitorClient.on('error', () => {
    console.log('remoteMonitorClient disconnected')
})

remoteMonitorClient.on('message', function (topic, payload, packet) {
    const display = document.getElementById('content')
    const data = JSON.parse(payload)
    display.innerHTML = `
        <div>Speed = ${data.speed} MPH </div>
        <div>Fuel = ${parseFloat(data.fuel).toFixed(2)} gallons</div>
        <div>Distance = ${parseFloat(data.distance).toFixed(2)} miles</div>
    `
    console.log(
        data
    )
})
