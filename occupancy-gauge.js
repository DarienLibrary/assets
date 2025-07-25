const baseUrl = `https://display.safespace.io`;
const spaceCode = '36b0a659';

const currentOccupancyDisplay = document.getElementById('current-occupancy-display');

let occupancy = 0;
let capacity = 0;

const ctx = document.getElementById('occupancyGauge').getContext('2d');
let occupancyChart; // To hold the Chart.js instance

// Function to update the gauge
function updateGauge(currentOccupancy, maxCapacity) {
    occupancy = currentOccupancy;
    capacity = maxCapacity;

    if (occupancy === null || capacity === null || capacity === 0) {
        currentOccupancyDisplay.textContent = 'N/A';
        return; // Handle cases where data is not available or capacity is zero
    }

    let displayOccupancyPercentage = (occupancy / capacity) * 100;
    const displayedPercentageValue = Math.max(0, Math.floor(displayOccupancyPercentage));

    let gaugeFillPercentage = Math.min(displayOccupancyPercentage, 100);
    let gaugeRemainingPercentage = 100 - gaugeFillPercentage;

    let gaugeSegmentColor;
    const lowThreshold = 60;
    const highThreshold = 90;
    const criticalThreshold = 99.9;

    if (occupancy / capacity * 100 < lowThreshold) {
        gaugeSegmentColor = '#2ECC40';
    } else if (occupancy / capacity * 100 < highThreshold) {
        gaugeSegmentColor = '#FFDC00';
    } else if (occupancy / capacity * 100 <= criticalThreshold) {
        gaugeSegmentColor = '#FF851B';
    } else {
        gaugeSegmentColor = '#FF4136';
    }

    const data = {
        datasets: [{
            data: [gaugeFillPercentage, gaugeRemainingPercentage],
            backgroundColor: [gaugeSegmentColor, '#E0E0E0'],
            borderWidth: 0,
        }]
    };

    if (occupancyChart) {
        occupancyChart.data.datasets[0].data = data.datasets[0].data;
        occupancyChart.data.datasets[0].backgroundColor = data.datasets[0].backgroundColor;
        occupancyChart.update();
    } else {
        occupancyChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                circumference: 180,
                rotation: -90,
                cutout: '70%',
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                },
                animation: { animateRotate: true, animateScale: true },
                events: [],
            },
            plugins: [{
                afterDatasetDraw: (chart, args, options) => {
                    const { ctx, chartArea: { left, right, top, bottom, width, height } } = chart;
                    ctx.save();
                    const centerX = width / 2;
                    const centerY = height;
                    const angleInDegrees = (displayOccupancyPercentage * 1.8) - 90;
                    const angleInRadians = angleInDegrees * Math.PI / 180;
                    const needleLength = width * 0.4;
                    const needleWidth = 6;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(angleInRadians);
                    ctx.beginPath();
                    ctx.moveTo(0, -needleWidth / 2);
                    ctx.lineTo(needleLength, 0);
                    ctx.lineTo(0, needleWidth / 2);
                    ctx.closePath();
                    ctx.fillStyle = '#333';
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(0, 0, needleWidth * 1.5, 0, 2 * Math.PI);
                    ctx.fillStyle = '#666';
                    ctx.fill();
                    ctx.restore();
                }
            }]
        });
    }
    currentOccupancyDisplay.textContent = `${displayedPercentageValue}%`;
}

async function fetchDataAndUpdateGauge() {
    try {
        const [occupancyResponse, capacityResponse] = await Promise.all([
            fetch(`${baseUrl}/value/live/${spaceCode}`).then(response => response.text()),
            fetch(`${baseUrl}/entity/space/hash/${spaceCode}`).then(response => response.json())
        ]);
        const currentOccupancy = +occupancyResponse;
        const maxCapacity = +capacityResponse.space.maxCapacity;
        updateGauge(currentOccupancy, maxCapacity);
    } catch (error) {
        console.error("Error fetching occupancy data:", error);
        currentOccupancyDisplay.textContent = 'Error';
    }
}

fetchDataAndUpdateGauge();
setInterval(fetchDataAndUpdateGauge, 30000);
