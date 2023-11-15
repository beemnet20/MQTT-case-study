const uuid = () => {
    var temp_url = URL.createObjectURL(new Blob())
    var uuid = temp_url.toString()
    URL.revokeObjectURL(temp_url)
    return uuid.substr(uuid.lastIndexOf('/') + 1)
}

const url = window.location.protocol === 'file:'? 'ws://broker.emqx.io:8083/mqtt' : 'wss://broker.emqx.io:8084'

const bigTruckOptions = {
    // Clean session
    clean: true,
    connectTimeout: 4000,
    // Authentication
    clientId: `big-truck-client-${uuid()}`,
    username: 'big-truck',
    password: 'big-truck',
}

const myTopic = `big-truck-telemetry-data-${uuid()}`

const bigTruckClient = mqtt.connect(url, bigTruckOptions)

bigTruckClient.on('error', () => {
    console.log('bigTruckClient disconnected')
})


const minSpeed = 0
const maxSpeed = 300 //equates to 30MPH
let speed = minSpeed
let lastTimestamp = null
let angle = 0

const fuelRate = 0.3 //miles per gallon
const fullTank = 1000 //in gallons
let fuel = fullTank
let distance = 0

const setWheelSpinSpeed = (newSpeed) => {
    speed = newSpeed // Update the speed
    // Restart the animation only if it's not already running
    if (lastTimestamp === null) {
        requestAnimationFrame(animateWheels)
    }
}

const displaySpeed = (speed) => {
    const speedReadout = document.getElementById('speed-readout')
    speedReadout.textContent = `Speed: ${Math.floor(speed / 10)} MPH`
}

const displayFuel = (fuel) => {
    const fuelReadout = document.getElementById('fuel-readout')
    fuelReadout.textContent = `Fuel: ${parseFloat(fuel).toFixed(2)} gallons`
}

const displayDistance = (distance) => {
    const distanceReadout = document.getElementById('distance-readout')
    distanceReadout.textContent = `Distance: ${parseFloat(distance).toFixed(
        2
    )} miles`
}

const animateWheels = (timestamp) => {
    if (lastTimestamp === null) {
        lastTimestamp = timestamp
    }

    const delta = timestamp - lastTimestamp // Time since last frame
    angle += speed * (delta / 1000) // Update the angle based on speed and time elapsed
    angle = angle % 360 // Keep the angle within 0-360 degrees

    const wheels = document.querySelectorAll('.wheel')
    wheels.forEach((wheel) => {
        wheel.style.transform = `rotate(${angle}deg)` // Apply rotation
    })

    lastTimestamp = timestamp
    requestAnimationFrame(animateWheels) // Request next frame
}

// Initialize the animation at the minimum speed
setWheelSpinSpeed(minSpeed)
displaySpeed(speed)
displayFuel(fuel)
displayDistance(distance)

const startButton = document.getElementById('start')
const pedal = document.getElementById('pedal')
let popup = null;

let pedalIntervalId;
let publishingIntervalId;
let dt = 200
let a = 0.15

startButton.addEventListener('click', () => { 
    clearInterval(publishingIntervalId)
    if(startButton.textContent.trim() === "Start"){
        pedal.disabled = false
        startButton.textContent = "Stop"
        let params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,
                    width=600,height=300`
    
        popup = window.open(`popup.html?topic=${myTopic}&url=${url}`,'popup', params)
        publishingIntervalId = setInterval(()=>{
            bigTruckClient.publish(
                myTopic,
                JSON.stringify({speed:Math.floor(speed/10), fuel:fuel, distance:distance}),
                { qos: 0, retain: false },
                function (error) {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log('Published')
                    }
                }
            )
        }, dt)
    } else {
        setWheelSpinSpeed(0);
        fuel = fullTank;
        distance = 0;
        displayDistance(distance)
        displaySpeed(speed)
        displayFuel(fuel)
        if(popup) popup.close()
        pedal.disabled = true
        startButton.textContent = "Start"
    }

})

pedal.addEventListener('mouseover', function () {
    // Clear any existing intervals to avoid multiple overlapping intervals
    clearInterval(pedalIntervalId)

    // Start a new interval
    pedalIntervalId = setInterval(() => {
        let deltaD = (speed / 10) * (dt / (60 * 60 * 1000)) //distance in miles
        distance += deltaD
        fuel -= deltaD / fuelRate //0.3m/1g = d/x => x*.3 = d => x = d/.3
        if (speed < maxSpeed) {
            speed = a * dt + speed
        } else {
            // clearInterval(intervalId);
        }
        setWheelSpinSpeed(speed)
        displaySpeed(speed)
        displayFuel(fuel)
        displayDistance(distance)
    }, dt)
})

pedal.addEventListener('mouseout', function () {
    clearInterval(pedalIntervalId)
    pedalIntervalId = setInterval(() => {
        let deltaD = (speed / 10) * (dt / (60 * 60 * 1000)) //distance in miles
        distance += deltaD
        if (speed > minSpeed) {
            speed = -a * dt + speed
        } else {
            clearInterval(pedalIntervalId)
        }
        setWheelSpinSpeed(speed)
        displaySpeed(speed)
        displayFuel(fuel)
        displayDistance(distance)
    }, dt)
})
