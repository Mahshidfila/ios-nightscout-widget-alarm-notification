const nsUrl =''; // your nightscout url
const nsToken =``; // your nightscout access token
const glucoseDisplay = mgdl;
//const glucoseDisplay =  mmoll;
const dateFormat  = fr-FR;

// Variable to store last alarm time
let lastAlarmTime = 0; // Initialize the variable here

// Initialize Widget
let widget = await createWidget();
if (!config.runsInWidget) {
    await widget.presentSmall();
}

Script.setWidget(widget);
Script.complete();

// Build Widget
async function createWidget(items) {
    const list = new ListWidget();
    let glucose, updated;
    
    let nsDataV2 = await getNsDataV2();
   
    // create direction arrow
    let directionString = await getDirectionString(nsDataV2.direction);
  
    let glucoseValue = nsDataV2.bg;
    
    if(glucoseDisplay === `mmoll`){
        glucoseValue = Math.round(nsDataV2.bg / 18 * 10) / 10;
    }
  
    glucose = list.addText("  " + glucoseValue + " " + directionString);
    glucose.font = Font.mediumSystemFont(37);
    
    list.setPadding(30, 10, 30, 0);
    
    let updateTime = new Date(nsDataV2.mills).toLocaleTimeString(dateFormat, { hour: "numeric", minute: "numeric" })
    updated = list.addText("" + updateTime);
    updated.font = Font.mediumSystemFont(8); 
     
    list.refreshAfterDate = new Date(Date.now() + 30);

    // Check if glucose is below 100 and send notification
    if (glucoseValue < 100) {
        let currentTime = Date.now();
        // If more than 15 minutes have passed since last alarm
        if (currentTime - lastAlarmTime > 30 * 60 * 1000) {
            sendNotification(glucoseValue);
            lastAlarmTime = currentTime; // Update last alarm time
        }
    }

    return list;
}

async function getNsDataV2() {
    let url = nsUrl + "/api/v2/properties?&token=" + nsToken;
    let data = await new Request(url).loadJSON();
    return {
        bg: data.bgnow.mean,
        direction: data.bgnow.sgvs[0].direction,
        mills: data.bgnow.mills
    };
}

async function getDirectionString(direction) {
    let directionString;
    switch(direction) {
        case 'NONE':
        directionString = '⇼';
        break;
        case 'DoubleUp':
        directionString = '⇈';
        break;
        case 'SingleUp':
        directionString = '↑';
        break;          
        case 'FortyFiveUp':
        directionString = '↗';
        break;                  
        case 'Flat':
        directionString = '→';
        break;                      
        case 'FortyFiveDown':
        directionString = '↘';
        break;
        case 'SingleDown':
        directionString = '↓';
        break;  
        case 'DoubleDown':
        directionString = '⇊';
        break;
        case 'NOT COMPUTABLE':
        directionString = '-';
        break;  
        case 'RATE OUT OF RANGE':
        directionString = '⇕';
        break;
        default:
        directionString = '⇼';
    }
    return directionString;
}

async function sendNotification(glucoseValue) {
    let notification = new Notification();
    notification.title = "قند خون پایین";
    notification.body = قند خون به ${glucoseValue} mg/dl رسیده است.;

    // Set custom sound or use default system sound
    notification.sound = 'default'; // You can replace 'default' with a custom sound file path if available

    await notification.schedule();
}
