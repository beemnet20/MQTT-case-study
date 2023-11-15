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

let data = { speed: [], fuel: [], distance: [] }

const getOptions = (name, data, yMax) => {
    return {
        series: [
            {
                name: name,
                data: data,
            },
        ],
        chart: {
            id: 'realtime',
            height: 200,
            type: 'line',
            animations: {
                enabled: true,
                easing: 'linear',
                dynamicAnimation: {
                    speed: 100,
                },
            },
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: 'smooth',
        },
        title: {
            text: name,
            align: 'left',
        },
        markers: {
            size: 0,
        },
        xaxis: {
            type: 'datetime',
        },
        yaxis: {
            max: yMax,
        },
        legend: {
            show: false,
        },
    }
}

let speedChart = new ApexCharts(
    document.querySelector('#speed-chart'),
    getOptions('Speed (mph)', data.speed, 30)
)
speedChart.render()
let fuelChart = new ApexCharts(
    document.querySelector('#fuel-chart'),
    getOptions('Fuel (gallons)', data.speed, 1000)
)
fuelChart.render()
let distanceChart = new ApexCharts(
    document.querySelector('#distance-chart'),
    getOptions('Distance (miles)', data.speed)
)
distanceChart.render()

remoteMonitorClient.on('message', function (topic, payload, packet) {
    const display = document.getElementById('content')
    const transmittedData = JSON.parse(payload)
    const timestamp = new Date()
    data.speed = [...data.speed, { x: timestamp, y: transmittedData.speed }]
    data.fuel = [
        ...data.fuel,
        { x: timestamp, y: parseFloat(transmittedData.fuel).toFixed(2) },
    ]
    data.distance = [
        ...data.distance,
        { x: timestamp, y: parseFloat(transmittedData.distance).toFixed(2) },
    ]

    display.innerHTML = `
    <div class="row text-center m-2">
        <div class="col-3 card m-1">Speed = ${transmittedData.speed} MPH </div>
        <div class="col-4 card m-1">Fuel = ${parseFloat(transmittedData.fuel).toFixed(2)} gallons</div>
        <div class="col-4 card m-1">Distance = ${parseFloat(transmittedData.distance).toFixed(
            2
        )} miles</div>
    </div>
    `
    speedChart.updateSeries([{ data: data.speed }])
    fuelChart.updateSeries([{ data: data.fuel }])
    distanceChart.updateSeries([{ data: data.distance }])
})
