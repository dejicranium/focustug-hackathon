/// hooks

const GLOBALS = {
    intensity: 'intense',
    task: '',
    task_keyword: '',

    work_timer_seconds: 60,
    break_timer_seconds: 15,

    total_work_time: 0,
    focus_percentage: 0,
    
    
    distracting_hosts: {},
}

const INTERVALS = {
    work_timer_interval: null,
    break_timer_interval: null,
}

let SESSION = {
    previous_tab_id: null,
    total_distraction_time: 0,

    task: '',
    keywords: '',
    intensity: 'intense',
    work_timer: 60,
    break_timer: 15,

    break_is_due: false,
    break_time_ongoing: false,

    tabs: [],
    evaluatedPages: {
        
    },
    evaluatedHosts: {

    },

    total_work_time: 0,
    
    break_time_left: 0,
    break_due_interval: null

}

chrome.tabs.onRemoved.addListener(async (tabiId, info)=> {
    await stopTotalDistractionTimeCounter(tabId)
})

function initializeTotalDistractionTimeCounter(tabId) {
    try {
        console.log('setting distraction timer')
        return new Promise((resolve, reject) => {
            
            clearInterval(INTERVALS['total_distraction_time'])
            INTERVALS['total_distraction_time'] = setInterval(() => {
                SESSION.total_distraction_time++;
                chrome.runtime.sendMessage({
                    message: 'total-distraction-time',
                    data: {
                        time: SESSION.total_distraction_time
                    }
                })
                console.log(SESSION.total_distraction_time)
                console.log(GLOBALS.distracting_hosts)
                

                chrome.tabs.get(parseInt(tabId), async(t) => {
                    const tab = t
                    let host = new URL(tab.url).hostname;
                    let splitt = host.split('www.');
                    if (splitt && splitt.length > 1) {
                        host = splitt[1]
                    }
        
                    const distracting_host = GLOBALS.distracting_hosts[host]
                    if (distracting_host) {
                        distracting_host.time++;

                        console.log('distracting hosts');

                        console.log(GLOBALS.distracting_hosts)
                    }

                    resolve()   

                })
    
            }, 1000)
        })

    } catch (e) {
        //console.log(e)
    }


}


function stopTotalDistractionTimeCounter(tabId) {
    try {
        return new Promise((resolve, reject) => {

            clearInterval(INTERVALS['total_distraction_time']);
            INTERVALS['total_distraction_time'] = null
            resolve()
        })
    } catch (e) {
        throw e
    }
}



// on installed 
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        //call a function to handle a first install
       // showControlPanel(false)

       publishScores()
      
    }else if(details.reason == "update"){
        //call a function to handle an update
       // showControlPanel(false)
    }

});


chrome.action.onClicked.addListener(function(tab) {
    //get session 
   

    showControlPanel(true)
    
});





// popups

chrome.runtime.onMessage.addListener((message) => {
    if(message.message === 'set-session-intensity') {
        console.log('set intennsity')
        SESSION.intensity = message.data
        console.log('seeting intensity')
    }
})



function uiSetIntensity() {

   
    
}

function uiSetTimer() {

}
function showControlPanel(activeTabOnly = false) {
    const obj = {};
    if (activeTabOnly === true) obj.active = true;
    chrome.tabs.query({active: true, currentWindow: true}).then(tabs => {
                let tab_id = null;
                let tab = tabs[0]
                tab_id = tab
                console.log(tab)
                if (tab.id) {
                    tab_id = tab.id
                }
                
                try {
    
                    chrome.scripting.executeScript({
                        target: {
                            tabId: parseInt(tab_id)
                        },
                        //files : [ "parn.js"],
                        func: setupControl,
                        args: [SESSION.task]
            
                    }).then((e) => {
                        try {
    
                            chrome.scripting.executeScript({
                                target: {
                                    tabId: parseInt(tab_id)
                                },
                                //files : [ "parn.js"],
                                func: loadControlScript,
                    
                            }).then(e=> {
                                console.log('loaded content script')
                            })
                        }catch(e) {
                            throw e
                        }
                    }).catch(e => {
                        throw e
                    })
                }catch(e) {
                    console.log(e)
                }
            
        

    })

}

function loadBodyExtractionScript(wait_till_load=false) {
    console.log("loadBodyExtractionScript")
    let description;

    let description_element = document.querySelector('meta[name="description"]') || document.querySelector("meta[name='og:description'") || document.querySelector("meta[name='twitter:description'");
    if (description_element) {
        description = description_element.content;
    }


    const cleaned = removeStopWords(description);

    if (wait_till_load === true) {
        window.addEventListener('load', function() {

            if(document.readyState == 'complete') {
            
                let counter =0;
                console.log('loaded')
                while(counter ===0) {
    
                    chrome.runtime.sendMessage({
                        message: 'compute-page-relevance',
                        data: {
                            description: cleaned,
                            body:  document.body.innerText
                        }
                    });
                    counter++
                }
            }
                
            
            
        })

    }
    else {
        chrome.runtime.sendMessage({
            message: 'compute-page-relevance',
            data: {
                description: cleaned,
                body:  document.body.innerText
            }
        });
    }
    

    function removeStopWords(text) {
        if (text) {

            const stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now']
            const split_text = text.split(' ');

            let new_word = ''

            split_text.forEach(token => {
                if (!stopwords.includes(token) && token) {
                    new_word+= `${token} `
                }
            })

            // return the first 60 ccharacters.
            

            return new_word;
       
        }
        else {
            return ''
        }
       
    }

    
    // send the dscription
    
   
}

function removePopUp() {
    const popup = document.getElementsByClassName('foctugp-popup')[0];

    if (popup) {
        document.body.removeChild(popup)
    }
}
 
function setupControl(session) {
    const focus_control_div = document.createElement('div');

    // see if it exists; 
    const exists = document.getElementById('focustug-control')
    if (!exists) {
        focus_control_div.classList.add('focustug-control');
        focus_control_div.id = 'focustug-control'
        focus_control_div.style.position = 'fixed';
        focus_control_div.left = '16'
        focus_control_div.top = '16'
       
    
        focus_control_div.innerHTML = `
        
                  <div class="focustug-control__container">
                <div class="focustug-control__header">
                <svg width="20" height="20" style="margin-right: 8px" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 20C0 8.95431 8.95431 0 20 0H107.914C118.96 0 127.914 8.95431 127.914 20V108C127.914 119.046 118.96 128 107.914 128H63.9571H20C8.95431 128 0 119.046 0 108V20Z" fill="#4ECB71"/>
                <path d="M87.1888 92.0064C93.7486 99.4696 99.8596 105.85 102.09 93.1442C104.32 80.4381 100.618 77.3755 91.6029 70.1161C82.5875 62.8567 73.2505 63.0486 73.2505 63.0486C71.7286 65.0858 80.6289 84.5432 87.1888 92.0064Z" fill="white"/>
                <path d="M66.3447 95.5589C62.0469 103.022 58.0432 109.403 56.5821 96.6967C55.1209 83.9906 57.5461 80.9279 63.4527 73.6686C69.3593 66.4092 75.4766 66.6011 75.4766 66.6011C76.4737 68.6383 70.6425 88.0957 66.3447 95.5589Z" fill="white"/>
                <path d="M62.7504 89.1592C66.367 72.0235 70.3847 74.145 72.331 68.9505" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M62.7504 89.1592C66.367 72.0235 70.3847 74.145 72.331 68.9505" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M52.6741 60.9107L0.088107 64.7112L0.0878906 70.7879L58.4753 66.7158L52.6741 60.9107ZM56.4233 60.6398L62.2333 66.4537L128 61.8668V55.4668L56.4233 60.6398Z" fill="white"/>
                <path d="M76.9167 53.8243C79.2821 52.5088 81.9128 53.5823 82.7926 56.2219C83.6723 58.8616 82.468 62.0678 80.1025 63.3832L71.9248 67.931C69.5594 69.2464 66.9287 68.1729 66.0489 65.5333C65.1692 62.8936 66.3736 59.6874 68.739 58.372L76.9167 53.8243Z" fill="white"/>
                <path d="M92.6752 85.6066C87.1552 68.4709 81.0227 70.5924 78.0521 65.3978" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M92.6752 85.6066C87.1552 68.4709 81.0227 70.5924 78.0521 65.3978" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                
                    FocusTug
                </div>

                <div class="focustug-control__tabs">
                    <div class="focustug-control__tabs__tab selected_tab" id="focustug-session-tab">
                        Session
                    </div>
                    <div class="focustug-control__tabs__tab" " id="focustug-insight-tab">
                        Insights
                    </div>
                </div>
        
                <div class="focustug-control__leaderboard" style="display: none">
                    <p> Accountability Group</p>
                    <table id="accountability-leaderboard"> 
                        <tr class="table-header">
                            <td> User </td>
                            <td> Productivy (%) </td>
                        </tr>
                        
                    </table>
                    <p style="color :grey;  text-align: center; display: block; margin: 16px 0; font-size: 12px;"> </p>
        
        
                </div>
            
        
                <div class="focustug-control__leaderboard" style="display:none">
                    <p> Distractions today</p>
                    <table id="distractions-table"> 
                        <tr class="table-header">
                            <td> Site </td>
                            <td> Time spent</td>
                            <td>Actions</td>
                        </tr>
                        
                       
                    
                        
                    </table>
                    <p style="color :grey;  text-align: center; display: block; margin: 16px 0; font-size: 12px;"> </p>
        
        
                </div>
                
                <div id="break-time-alert" 
                class="landing-container"
                    style=" 
                    padding: 16px; 
                    border-radius: 10px;
                    display: none;
                    
                    box-sizing: border-box;">
                <div style=" box-sizing: border-box; padding: 16px; 
                    background: orange;  
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 10px;
                    width: 100%;" class="break-time-alert-container">
                    <div style="height: 100%;">
        
                        <p style="font-size: 18px; font-weight: 500; display: flex; align-items: center;">                                    
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 17V7C13 6.45 13.196 5.979 13.588 5.587C13.98 5.195 14.4507 4.99933 15 5H17C17.55 5 18.021 5.196 18.413 5.588C18.805 5.98 19.0007 6.45067 19 7V17C19 17.55 18.804 18.021 18.412 18.413C18.02 18.805 17.5493 19.0007 17 19H15C14.45 19 13.979 18.804 13.587 18.412C13.195 18.02 12.9993 17.5493 13 17ZM5 17V7C5 6.45 5.196 5.979 5.588 5.587C5.98 5.195 6.45067 4.99933 7 5H9C9.55 5 10.021 5.196 10.413 5.588C10.805 5.98 11.0007 6.45067 11 7V17C11 17.55 10.804 18.021 10.412 18.413C10.02 18.805 9.54934 19.0007 9 19H7C6.45 19 5.979 18.804 5.587 18.412C5.195 18.02 4.99934 17.5493 5 17ZM15 17H17V7H15V17ZM7 17H9V7H7V17Z" fill="black"/>
                            </svg>
                        Break time is due!</p>
        
                        <p style="font-size: 15px;" id="break-time-due"></p>
                    </div>
                    <button id="start-break" style="background: transparent !important; 
                                                    margin-left: 21px;
                                                    border: 2px solid black !important;
                                                    color: black;"> 
                    Start break</button>
                </div>
            </div>
            <div id="break-time-ongoing"
            class="landing-container" style=" padding: 16px; 
                    box-sizing: border-box; display: none;">
                <div style=" box-sizing: 
                    border-box; padding: 16px; 
                    border-radius: 10px;
                    background: orange;  
                    width: 100%; display: flex; justify-content: space-between; align-items: center;" class="break-time-alert-container">
                    
        
                    <div style="display: flex;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 17V7C13 6.45 13.196 5.979 13.588 5.587C13.98 5.195 14.4507 4.99933 15 5H17C17.55 5 18.021 5.196 18.413 5.588C18.805 5.98 19.0007 6.45067 19 7V17C19 17.55 18.804 18.021 18.412 18.413C18.02 18.805 17.5493 19.0007 17 19H15C14.45 19 13.979 18.804 13.587 18.412C13.195 18.02 12.9993 17.5493 13 17ZM5 17V7C5 6.45 5.196 5.979 5.588 5.587C5.98 5.195 6.45067 4.99933 7 5H9C9.55 5 10.021 5.196 10.413 5.588C10.805 5.98 11.0007 6.45067 11 7V17C11 17.55 10.804 18.021 10.412 18.413C10.02 18.805 9.54934 19.0007 9 19H7C6.45 19 5.979 18.804 5.587 18.412C5.195 18.02 4.99934 17.5493 5 17ZM15 17H17V7H15V17ZM7 17H9V7H7V17Z" fill="black"/>
                        </svg>
                        
                        <div>
        
                            <p style="font-weight: 500; font-size: 18px;">Break ongoing</p>
                            <p style="font-size: 13px;" id="break-time-left"></p>
                        </div>
                    </div>
                    <button id="end-break" style="background: transparent !important; 
                            border: 2px solid black !important;
                            font-weight: 500 !important;
                            color: black;"> End</button>
                </div>
            </div>
        
            
        
        
                <div id="focustug-loading" class="lds-container" style="display: none; justify-content: center;">
                    <div class="lds-hourglass"></div>
                </div>
        
                <div class="focustug-control__content" id='focustug-main-control'>
                    <div class="focustug-control-section focustug-control-taskarea">
                        <p class="focustug-control-section__header">Start a new task</p>
                        <textarea id="focustug-task-textarea" placeholder="Enter description of your task" style="margin-top: 8px"></textarea>
                    </div>
                    <div class="focustug-control-section focustug-control-taskarea">
                        <p class="focustug-control-section__header">Intensity</p>
        
                        <div style="display: grid; grid-template-columns: 48% 48%; justify-content: space-between">
                            <div class="focustug-control-section__intensity focustug-intensity-chosen" id="intensity-hard">
                                <p class="focustug-control-section__intensity__header">Very Intense</p>
                                <p class="focustug-control-section__intensity__desc">Block every distraction</p>
                            </div>
                            <div class="focustug-control-section__intensity" id="intensity-mild">
                                <p class="focustug-control-section__intensity__header">Mild</p>
                                <p class="focustug-control-section__intensity__desc">Show a simple focus bar</p>
                            </div>
                        </div>
                        
                    </div>
        
                    <div class="focustug-control-section focustug-control-timer">
                        <p class="focustug-control-section__header">Timer</p>
                        <div class="focustug-control-timer__container">
        
        
                            <div style="display: flex; height: fit-content !important">
        
                                <div>
                                
                                    <p id="work-time-display">1 hour</p>
                                    <p>Work</p>
                                </div>
                                <div>
                                    <button style=" background:  rgba(0, 0, 0, 0.299);;  margin-bottom: 10px; border:0; display: flex; justify-content:center;" id='work-time-increase' class='timer-control'> 
                                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 10L7.5 3L14 10" stroke="white" stroke-linecap="square"/>
                                        </svg>
                                            
        
                                    </button>
                                    <button style="background:  rgba(0, 0, 0, 0.299);; border:0; display: flex; justify-content:center;" id='work-time-decrease' class='timer-control'> 
                                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 5L7.5 12L1 5" stroke="white" stroke-linecap="square"/>
                                        </svg>
                                            
                                    </button>
                                </div>
                            </div>
                            <div style="display: flex; height: fit-content !important;">
                                <div>
                                    <p id="break-time-display">15 minutes</p>
                                    <p>Break</p>
                                </div>
        
                                <div>
                                <button style="background: rgba(0, 0, 0, 0.299); margin-bottom: 10px; border:0; display: flex; justify-content:center;" id='break-time-increase' class='timer-control'> 
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 10L7.5 3L14 10" stroke="white" stroke-linecap="square"/>
                                    </svg>
        
                                </button>
                                <button style="background:  rgba(0, 0, 0, 0.299);; border:0; display: flex; justify-content:center;" id='break-time-decrease' class='timer-control'> 
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 5L7.5 12L1 5" stroke="white" stroke-linecap="square"/>
                                    </svg>
                                </button>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div class="focustug-control-section focustug-control-timer">
                        <p class="focustug-control-section__header">Accountability Group</p>
                       
                        <select id="focustug-group-select" style="margin-top: 8px; width: 100%; background: rgba(255, 255, 255, 0.10); border: 0; padding: 16px; border-radius: 10px; color: white; font-size: 16px;">
                           <!--- <option id="focustug-group-item">Flutterwave #199923</option>--->
                        </select> 
                
                        <div id="focustug-new-group-container" style="margin-top: 8px; display: none">
                            <label for="" style="margin-bottom: 8px; display: block;">Group Name</label>
                            <input style="width: 100%; padding: 16px; background:rgba(255, 255, 255, 0.10); border: 0; border-radius: 10px;"/>
                        </div>
                        <div id="focustug-join-group-container" style="margin-top: 8px; display: none">
                            <label for="" style="margin-bottom: 8px; display: block;">Group Code</label>
                            <input style="width: 100%; padding: 16px; background:rgba(255, 255, 255, 0.10); border: 0; border-radius: 10px;"/>
                        </div> 
                       
                        <div style="margin-top: 2px; color: grey; display: none">
                            <p style="font-size: 14px;">Created a new group. You can share the code with whoever wants to join </p>
                        </div>
                       
                    </div>
        
                    <button class="focustug-control__startsession">Start Session</button>
                </div>
        
        
        
        
                <!--- when session is created-->
                <div class="focustug-control__content" id="focustug-session-control" style="margin: 24px 0; display: none">
                    <p style="padding-bottom: 16px; font-size: 16px; text-align:center;   white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;" > Session: ${session}</p>
        
                    <div style="display: grid; grid-template-columns: 30% 30% 30%; justify-content: space-between; ">
                        <div style="display:flex; justify-content: center; flex-direction: column; align-items: center">
                            <p style="color:#4ECB71; font-size: 16px;">Total</p>
                            <p id="focustug-sessiontime" style="font-size: 16px;color:#4ECB71"></p>
                        </div>
                        <div style="display:flex; justify-content: center; flex-direction: column; align-items: center;">
                            <p style="color: #A90F3D; font-size: 16px;">Distractions</p>
                            <p id="focustug-distractiontime" style="color: #A90F3D; font-size: 16px;"></p>
                        </div>
                        <div style="display:flex; justify-content: center; flex-direction: column; align-items: center;">
                            <p style="color: orange; font-size: 16px;">Leaderboard</p>
                            <p style="color: orange; font-size: 16px;"> 5th/10</p>
                        </div>
        
                    </div>
                    <button id="end-session-btn" class="focustug-control__endsession focustug-regular-button" style="margin-top: 24px;">End Session</button>
                </div>
        
        
        
                <!-- when registration shit-->
        
                <div class="focustug-control__content" id="focustug-auth-container" style="padding: 24px 0;">
        
                    <div id='focustug-login-container'>
        
                        <div class="focustug-auth-header">
                            Sign in to FocusTug and start blocking distractions while you work
                        </div>
                        <div class="focustug-form-control">
                            <input type="text" placeholder="Email" id='focustug-login-email'>
                        </div>
                        <div class="focustug-form-control">
                            <input type="password"
                             placeholder="Password" id='focustug-login-password'>
                        </div>
                        
                        <div class="focustug-form-already">
                            <p>Don't have an account? <span id="focustug-signup-onboarding">Sign up</span></p>
                        </div>
                        <button class="focustug-regular-button" id="focustug-login-cta"> Login </button>
        
                    </div>
        
        
                    <div style='display: none' id='focustug-signup-container'>
        
                        <div class="focustug-auth-header">
                            Sign up
                        </div>
                        <div class="focustug-form-control">
                            <input placeholder="Name" id="focustug-register-name">
                        </div>
                        <div class="focustug-form-control">
                            <input placeholder="Email" id="focustug-register-email">
                        </div>
                        <div class="focustug-form-control">
                            <input placeholder="Password" id="focustug-register-password">
                        </div>
                        <button class="focustug-regular-button" id="focustug-register-cta"> Sign Up </button>
        
                        <div class="focustug-form-already">
                            <p>Already have an account <span id="focustug-login-onboarding">Sign in</span></p>
                        </div>
        
                    </div>
                </div>
            
            
            
            
            
            
            
            </div>


        `
        
        document.body.append(focus_control_div)
    }
    else {
        document.body.removeChild(exists)
    }
    


}

function handleBreakDue() { 

    SESSION.break_is_due = false;
    clearInterval(GLOBALS.break_due_interval)
    GLOBALS.break_due_interval = null

    chrome.tabs.query({
        active: true
    }).then(tabs => {
        let tab_id = null;
        for (tab of tabs) {
            if (tab.id) {

                tab_id = tab.id
            }
        }
        console.log("handleBreakDue:  tab_id : " + tab_id)

        chrome.scripting.executeScript({
            target: {
                tabId: parseInt(tab_id)
            },
            //files : [ "parn.js"],
            func: showBreakAlert,

        }).then((e) => {
            console.log('distraction watch')
        }).catch(e => {
            throw e
        })
    })


}


function showBreakAlert() {
    const modal_div = document.createElement('div');
    modal_div.classList.add('blocker-modal');
    modal_div.classList.add('blocker-modal-red');
    modal_div.style.height = '100%';
    modal_div.style.width = '100%';
    modal_div.style.position = 'fixed';


    document.body.prepend(modal_div)



    modal_div.innerHTML += `
        <div class="blocker-modal">
            <div class="blocker-modal-container">
                <div class="blocker-modal-logo" style="display: flex; align-items: center;">
                    <svg width="20" height="20" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 10C0 4.47715 4.47715 0 10 0H37.9677C43.4905 0 47.9677 4.47715 47.9677 10V38C47.9677 43.5229 43.4905 48 37.9677 48H23.9838H10C4.47716 48 0 43.5229 0 38V10Z" fill="#4ECB71"/>
                        <path d="M32.6928 34.5024C35.1528 37.3011 37.4444 39.6939 38.2807 34.9291C39.117 30.1643 37.7289 29.0158 34.3481 26.2936C33.187 25.3586 32.0116 24.7532 30.9687 24.3613C28.7563 23.53 27.5428 25.2327 28.6962 27.7765C29.7827 30.1728 31.3655 32.9923 32.6928 34.5024Z" fill="white"/>
                        <path d="M34.7537 32.1024C32.6837 25.6766 30.3841 26.4721 29.2701 24.5241" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M34.7537 32.1024C32.6837 25.6766 30.3841 26.4721 29.2701 24.5241" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M24.8784 35.8346C23.2667 38.6333 21.7653 41.026 21.2174 36.2612C20.6695 31.4965 21.5789 30.348 23.7939 27.6257C24.4684 26.7967 25.1502 26.2268 25.7724 25.8351C27.3952 24.8135 28.2536 26.6265 27.3995 29.4323C26.6926 31.7543 25.7091 34.392 24.8784 35.8346Z" fill="white"/>
                        <path d="M23.5325 33.4347C24.8887 27.0088 26.3954 27.8044 27.1252 25.8564" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M23.5325 33.4347C24.8887 27.0088 26.3954 27.8044 27.1252 25.8564" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M19.7549 22.8415L0.0352374 24.2667L0.0351562 26.5455L21.9304 25.0184L19.7549 22.8415ZM21.1609 22.7399L23.3396 24.9201L48.0022 23.2V20.8L21.1609 22.7399Z" fill="white"/>
                        <path d="M28.839 20.1841C29.726 19.6908 30.7126 20.0934 31.0425 21.0832Lnan nanL31.0425 21.0832C31.3724 22.0731 30.9207 23.2754 30.0337 23.7687L26.967 25.4741C26.08 25.9674 25.0935 25.5648 24.7636 24.575Lnan nanL24.7636 24.575C24.4337 23.5851 24.8853 22.3828 25.7724 21.8895L28.839 20.1841Z" fill="white"/>
                        </svg>

                        <p style="margin-left: 8px; color: white; font-size: 20px;">FocusTug</p>
                        
                </div>

                <div>
                    <div style="width: 200px; height: 200px; margin: auto; display: flex; justify-content: center;"  id="blocker-illustration">

                        <img style="width: 100%; height: 100%; object-fit: contain" src="https://i.ibb.co/PY6CNJN/celebrate.png" alt="">
                    </div>
                    <div  id="blocker-close-message" style="color:white;" class="blocker-header-message">
                        It's break time!!!

                    </div>


                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 64px; width: 60%; margin: auto; margin-top: 16px;;">
                        <div style="display: flex">
                        <button id="focustug-suspend-break" style="margin-bottom: 24px; margin-right: 16px; border:0; color: black !important" class="blocker-close-cta"> Suspend to break time</button>
                        <button id="focustug-start-break" style="margin-bottom: 24px; margin-right: 16px; border: 0; color: black !important" class="blocker-close-cta"> Start break time</button>

                        </div>

                    </div>

                </div>



                <div class="blocker-bottom"> 
                        <!--<button>Ignore once</button>--->
                </div>
            </div>
        </div>
        `

        const suspend_btn = document.getElementById('focustug-suspend-break');
        const start_btn = document.getElementById('focustug-start-break');

        suspend_btn.addEventListener('click', function(e){
            modal_div.style.display = 'none';
            
        })
        
        start_btn.addEventListener('click', function(e){
            //document.getElementsByClassName("blocker-modal").style.display = 'none';
            chrome.runtime.sendMessage({message: 'start-break'}, function(response) {
                if (response) {
                    modal_div.style.display = 'none';
                }
            })
            
        })
}



function startBreak() {
    console.log('start break background')
    SESSION.break_time_ongoing = true;



    // duration 
    let duration_in_min = SESSION.break_timer;
    let duration_in_milliseconds = duration_in_min * 60 * 1000;
    SESSION.break_time_left = duration_in_milliseconds;


    GLOBALS.break_timer_interval = setInterval(() => {
        SESSION.break_time_left -= 60000;
        
    }, 60000)

    clearInterval(INTERVALS['total_distraction_time_for_' + SESSION.previous_tab_id])
    clearInterval(GLOBALS.total_work_time_interval)



    setTimeout(() => {
        duration_in_min = parseInt(duration_in_min);
        console.log('initializeBreakTime duration in mins ' + duration_in_min)

        duration_in_milliseconds = duration_in_min * 60 * 1000;
        endBreak()
    }, duration_in_milliseconds)


}

function endBreak() {
    SESSION.break_time_left = 0;
    SESSION.break_is_due = false;
    SESSION.break_time_ongoing = false;

    clearInterval(INTERVALS.break_timer_interval)
    //initializeBreakTime()
    //()
    try {
        startWorkTimer()
    } catch (e) {

    }


}

function publishScores() {
    GLOBALS['publish_scores_interval'] = setInterval(() => {

        chrome.storage.sync.get(null, async (settings) => {
            const userToken = settings  && settings.auth && settings.auth.USER_TOKEN
            try {   
    
                /*
    
                await sendRequest("https://leapstartlabapi.herokuapp.com/api/v1/groups/members", "POST", {}, {"Authorization":   `Bearer ${userToken}`}).then(resp=> {
                    console.log('result')
                    console.log(resp)
                }).catch(e=> {
                    throw e
                })*/
    
                const result =  await fetch("https://leapstartlabapi.herokuapp.com/api/v1/groups/scores", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${userToken}`,
                        "Content-Type": 'application/json'
                    },
                    body: JSON.stringify({percentage: GLOBALS.focus_percentage})
                }).then(resp => {
                    
    
                    return resp.json()
                })
            }catch(e) {
    
            }
        })
    }, 30000)


}




 chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message === 'get-active-session') {
        chrome.runtime.sendMessage({message: 'active-session', data: SESSION})
        sendResponse(SESSION.task)
        if(SESSION.task) {
            //setUpPopup()
        }
    }
   
    if (message.message == 'compute-page-relevance') {
        const tabId = sender.tab.id;
        const tab = sender.tab;

        computePageRelevance(tab, message.data)

    }
    if (message.message == 'end-session') {
        SESSION = {
            previous_tab_id: null,
            total_distraction_time: 0,
        
            task: '',
            keywords: '',
            intensity: 'intense',
            work_timer: 60,
            break_timer: 15,
        
            break_is_due: false,
            break_time_ongoing: false,
        
            tabs: [],
            evaluatedPages: {
                
            },
            evaluatedHosts: {
        
            },
        
            total_work_time: 0,
            
            break_time_left: 0,
            break_due_interval: null

        }
        Object.keys(INTERVALS).forEach(key=> {
            clearInterval(key)
        })

        // remov
        sendResponse(true)
    }

    if (message.message == 'get-focus-percentage') {
        sendResponse(GLOBALS.focus_percentage)
    }

    if (message.message === 'get-time') {
        sendResponse({
            total: SESSION.total_work_time,
            distraction: SESSION.total_distraction_time
        })
    }

    if (message.message === 'get-session-details') {
        sendResponse(SESSION)
    }

    if (message.message === 'start-break') {
        startBreak()
        sendResponse(true)
    }

    if (message.message  === 'get-distracting-hosts') {
        sendResponse(GLOBALS.distracting_hosts)
    }
})


function showPopUp() {
    console.log('show popupt')
    chrome.tabs.query({}).then(tabs => {
        let tab_id = null;
        //let tab = tabs[0]
        for (tab of tabs) {

            console.log(tab)
            if (tab.id) {
                tab_id = tab.id
            }
            chrome.scripting.executeScript({
                target: {
                    tabId: parseInt(tab_id)
                },
                //files : [ "parn.js"],
                func: setUpPopup,
    
            }).then((e) => {
                try {
                    chrome.scripting.executeScript({
                        target: {
                            tabId: parseInt(tab_id)
                        },
                        //files : [ "parn.js"],
                        func: loadControlScript,
            
                    })
                
                }catch(e) {
                    throw e
                }
            }).catch(e => {
                throw e
            })
        }
    })

}
    
       
function setUpPopup() {
    let focus_control_div = document.createElement('div');

    const exists = document.getElementsByClassName('foctug-popup')[0];
    if (!exists) {

        focus_control_div.classList.add('foctug-popup');
        focus_control_div.style.bottom = '16px'
        focus_control_div.style.left = '16px'
        focus_control_div.innerHTML += `<div class="foctug-popup__container">
                <div class="foctug-popup__tray">
                    
                
                    <div class="foctug-popup__item foctug-popup__item--partners">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 6H14L17.29 2.7C17.3829 2.60628 17.4935 2.53188 17.6154 2.48111C17.7373 2.43034 17.868 2.40421 18 2.40421C18.132 2.40421 18.2627 2.43034 18.3846 2.48111C18.5064 2.53188 18.617 2.60628 18.71 2.7L21.29 5.29C21.4762 5.47737 21.5808 5.73082 21.5808 5.995C21.5808 6.25919 21.4762 6.51264 21.29 6.7L19 9H11V11C11 11.2652 10.8946 11.5196 10.7071 11.7071C10.5196 11.8946 10.2652 12 9.99998 12C9.73477 12 9.48041 11.8946 9.29288 11.7071C9.10534 11.5196 8.99998 11.2652 8.99998 11V8C8.99998 7.46957 9.2107 6.96086 9.58577 6.58579C9.96084 6.21072 10.4695 6 11 6ZM4.99998 11V15L2.70998 17.29C2.52373 17.4774 2.41919 17.7308 2.41919 17.995C2.41919 18.2592 2.52373 18.5126 2.70998 18.7L5.28998 21.29C5.38295 21.3837 5.49355 21.4581 5.61541 21.5089C5.73726 21.5597 5.86797 21.5858 5.99998 21.5858C6.13199 21.5858 6.2627 21.5597 6.38456 21.5089C6.50642 21.4581 6.61702 21.3837 6.70998 21.29L11 17H15C15.2652 17 15.5196 16.8946 15.7071 16.7071C15.8946 16.5196 16 16.2652 16 16V15H17C17.2652 15 17.5196 14.8946 17.7071 14.7071C17.8946 14.5196 18 14.2652 18 14V13H19C19.2652 13 19.5196 12.8946 19.7071 12.7071C19.8946 12.5196 20 12.2652 20 12V11H13V12C13 12.5304 12.7893 13.0391 12.4142 13.4142C12.0391 13.7893 11.5304 14 11 14H8.99998C8.46955 14 7.96084 13.7893 7.58577 13.4142C7.2107 13.0391 6.99998 12.5304 6.99998 12V9L4.99998 11Z" fill="white"/>
                            </svg>
                            
                    </div>
                    <div class="foctug-popup__item foctug-popup__item--distractions">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M7.843 3.802C9.872 2.601 10.886 2 12 2C13.114 2 14.128 2.6 16.157 3.802L16.843 4.208C18.872 5.41 19.886 6.011 20.443 7C21 7.99 21 9.19 21 11.594V12.406C21 14.809 21 16.011 20.443 17C19.886 17.99 18.872 18.59 16.843 19.791L16.157 20.198C14.128 21.399 13.114 22 12 22C10.886 22 9.872 21.4 7.843 20.198L7.157 19.791C5.128 18.591 4.114 17.989 3.557 17C3 16.01 3 14.81 3 12.406V11.594C3 9.19 3 7.989 3.557 7C4.114 6.01 5.128 5.41 7.157 4.208L7.843 3.802ZM13 16C13 16.2652 12.8946 16.5196 12.7071 16.7071C12.5196 16.8946 12.2652 17 12 17C11.7348 17 11.4804 16.8946 11.2929 16.7071C11.1054 16.5196 11 16.2652 11 16C11 15.7348 11.1054 15.4804 11.2929 15.2929C11.4804 15.1054 11.7348 15 12 15C12.2652 15 12.5196 15.1054 12.7071 15.2929C12.8946 15.4804 13 15.7348 13 16ZM12 6.25C12.1989 6.25 12.3897 6.32902 12.5303 6.46967C12.671 6.61032 12.75 6.80109 12.75 7V13C12.75 13.1989 12.671 13.3897 12.5303 13.5303C12.3897 13.671 12.1989 13.75 12 13.75C11.8011 13.75 11.6103 13.671 11.4697 13.5303C11.329 13.3897 11.25 13.1989 11.25 13V7C11.25 6.80109 11.329 6.61032 11.4697 6.46967C11.6103 6.32902 11.8011 6.25 12 6.25Z" fill="white"/>
                            </svg>
                            
                    </div>
                    <div class="foctug-popup__item foctug-popup__item--task">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_29_6)">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 2C15.3511 2.00001 15.6959 2.09243 16 2.26796C16.304 2.4435 16.5565 2.69597 16.732 3H18C18.5304 3 19.0391 3.21071 19.4142 3.58579C19.7893 3.96086 20 4.46957 20 5V17C20 18.3261 19.4732 19.5979 18.5355 20.5355C17.5979 21.4732 16.3261 22 15 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V5C4 4.46957 4.21071 3.96086 4.58579 3.58579C4.96086 3.21071 5.46957 3 6 3H7.268C7.44353 2.69597 7.696 2.4435 8.00003 2.26796C8.30406 2.09243 8.64894 2.00001 9 2H15ZM14.824 9.379L10.582 13.621L9.167 12.207C8.9784 12.0248 8.7258 11.924 8.4636 11.9263C8.2014 11.9286 7.95059 12.0338 7.76518 12.2192C7.57977 12.4046 7.4746 12.6554 7.47233 12.9176C7.47005 13.1798 7.57084 13.4324 7.753 13.621L9.803 15.672C9.90515 15.7742 10.0264 15.8553 10.1599 15.9106C10.2934 15.9659 10.4365 15.9944 10.581 15.9944C10.7255 15.9944 10.8686 15.9659 11.0021 15.9106C11.1356 15.8553 11.2568 15.7742 11.359 15.672L16.239 10.793C16.3318 10.7001 16.4055 10.5898 16.4557 10.4684C16.5059 10.3471 16.5317 10.217 16.5317 10.0856C16.5317 9.9543 16.5057 9.82424 16.4554 9.70291C16.4051 9.58158 16.3314 9.47134 16.2385 9.3785C16.1456 9.28566 16.0353 9.21202 15.9139 9.1618C15.7926 9.11158 15.6625 9.08575 15.5311 9.0858C15.3998 9.08584 15.2697 9.11176 15.1484 9.16207C15.0271 9.21238 14.9168 9.28609 14.824 9.379ZM14.5 4H9.5C9.38297 3.99996 9.26964 4.04097 9.17974 4.11589C9.08984 4.19081 9.02906 4.29489 9.008 4.41L9 4.5V5.5C8.99996 5.61703 9.04097 5.73036 9.11589 5.82026C9.19081 5.91016 9.29489 5.97094 9.41 5.992L9.5 6H14.5C14.617 6.00004 14.7304 5.95903 14.8203 5.88411C14.9102 5.80919 14.9709 5.70511 14.992 5.59L15 5.5V4.5C15 4.38297 14.959 4.26964 14.8841 4.17974C14.8092 4.08984 14.7051 4.02906 14.59 4.008L14.5 4Z" fill="black"/>
                            </g>
                            <defs>
                            <clipPath id="clip0_29_6">
                            <rect width="24" height="24" fill="white"/>
                            </clipPath>
                            </defs>
                            </svg>
                            
                    </div>
                </div>
    
                <div class="foctug-popup__lead">
                    <div class="foctug-popup__lead__container">
                            <!--<div class="draggable">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 12H16V16H12V12ZM6 12H10V16H6V12ZM0 12H4V16H0V12ZM12 6H16V10H12V6ZM6 6H10V10H6V6ZM0 6H4V10H0V6ZM12 0H16V4H12V0ZM6 0H10V4H6V0ZM0 0H4V4H0V0Z" fill="#4ECB71"/>
                                    </svg>
                                    
                            </div>--->
                            <div class="foctug-popup__lead__bar" style="height:30px; border-radius: 5px !important">
                                <div class="foctug-popup__lead__bar__percentage" style="top:21%" id="foctug-popup__lead__bar__percentage">

                                </div>
                                <div class="foctug-popup__lead__bar__focusbar"  style="border-radius: 5px !important" id="foctug-popup__lead__bar__focusbar">
    
                                </div>
                            </div>
                    </div>
                </div>
            </div>`
    
        
    
    
            document.body.prepend(focus_control_div)
    }
    else {
        //exists.removeChild(exists);
    }

    setInterval(() => {
        // get global percentage;
        console.log('get global percentage')
        chrome.runtime.sendMessage({message:'get-focus-percentage'}).then(percentage=> {
            console.log('percentage gotten');
            if(document.getElementsByClassName('foctug-popup')[0]) {
                //percentage -= 20
                // check 
                if (percentage) {

                    document.getElementsByClassName('foctug-popup__lead__bar__focusbar')[0].style.width =percentage +'%'
                    document.getElementById('foctug-popup__lead__bar__percentage').innerText = percentage +'%' + ' focused'
                }
            }
        })
    },1000)

}


async function loadControlScript() {




    const getLoginCreds = () => new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (settings) => {
            const token = settings && settings.auth && settings.auth.USER_TOKEN;
            resolve(token)
        })
    })
    

    
    const creds = await getLoginCreds();
    
    if (creds) {
        document.getElementById('focustug-main-control').style.display = 'block';
        document.getElementById('focustug-auth-container').style.display = 'none';

        for (let el of document.getElementsByClassName("focustug-control__tabs__tab")) {
            el.style.display = 'flex'
        }

    }
    else {
        document.getElementById('focustug-auth-container').style.display = 'block'
        document.getElementById('focustug-main-control').style.display = 'none'

        for (let el of document.getElementsByClassName("focustug-control__tabs__tab")) {
            el.style.display = 'none'
        }


    }


    const tabs = document.getElementsByClassName("focustug-control__tabs__tab");
    for (let i = 0; i < tabs.length; i++) {
         const tab = tabs[i];
         tab.addEventListener("click", function(e) {
             if (e.currentTarget.id ==='focustug-insight-tab') {
                 e.currentTarget.classList.add("selected_tab");
    
    
                 document.getElementById('focustug-main-control').style.display = 'none'
                 document.getElementById('focustug-session-tab').classList.remove('selected_tab')
                 for(let el of document.getElementsByClassName("focustug-control__leaderboard")) {
                    el.style.display = 'block'
                 }
             }
             else {
                document.getElementById('focustug-main-control').style.display = 'block'
    
                 document.getElementById('focustug-session-tab').classList.add('selected_tab')
                 document.getElementById('focustug-insight-tab').classList.remove('selected_tab')
                 for(let el of document.getElementsByClassName("focustug-control__leaderboard")) {
                    el.style.display = 'none'
                 }
    
             }
             
             
         })
    
         
    }
    
    async function sendRequest(url, method, body, headers = {}) {
        try {   

    
            return await fetch(url, {
                method,
                body: JSON.stringify(body),
                headers: {
                    ...headers,
                    "Content-Type": 'application/json'
                }
            }).then(resp => {
                return resp.json()
            })
        } catch (e) {}
    }

    
    try { 

        /*****
         * 
         * 
         * 
         * 
         * 
         * accountabilityy group members
         */
        chrome.storage.sync.get(null, async (settings) => {
            console.log('trying to get members')
            const userToken = settings  && settings.auth && settings.auth.USER_TOKEN
            console.log('token')
            try {   

                /*

                await sendRequest("https://leapstartlabapi.herokuapp.com/api/v1/groups/members", "POST", {}, {"Authorization":   `Bearer ${userToken}`}).then(resp=> {
                    console.log('result')
                    console.log(resp)
                }).catch(e=> {
                    throw e
                })*/

                const result =  await fetch("https://leapstartlabapi.herokuapp.com/api/v1/groups/members", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${userToken}`,
                        "Content-Type": 'application/json'
                    }
                }).then(resp => {
                    

                    return resp.json()
                })

                if (result && result.data) {
                    result.data.forEach(member=> {
                        document.getElementById('accountability-leaderboard').innerHTML +=

                        `
                            <tr>
                            <td>${member.user.name}</td>
                            <td>${member.user.producitivity_scores && member.user.producitivity_scores[0]?.percentage || 0}%</td>
                        </tr>
                        `
                    })
                }
            }catch(e) {
                throw e
            }
        })
        
        // get distracting sites
        chrome.runtime.sendMessage({message: 'get-distracting-hosts'}, function(response) {
            // distracting table
            console.log('get distracting sites')
            console.log('response')




            console.log(response)
            for (let i = 0; i < Object.keys(response).length; i++) {

                const site = Object.keys(response)[i];
                document.getElementById('distractions-table').innerHTML += `
                    <tr>
                        <td>${site}</td>
                        <td>${response[Object.keys(response)[i]].time}</td>
                        <td><button style="display: flex; align-items: center; padding: 8px; "> <svg style="margin-right: 5px;" width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM2 10C2 5.58 5.58 2 10 2C11.85 2 13.55 2.63 14.9 3.69L3.69 14.9C2.59177 13.5031 1.99639 11.7769 2 10ZM10 18C8.15 18 6.45 17.37 5.1 16.31L16.31 5.1C17.4082 6.49686 18.0036 8.22311 18 10C18 14.42 14.42 18 10 18Z" fill="#E02A2A"/>
                            </svg>
                            Hard lock</button></td>
                    </tr>
                `
            }

        })


        /**
         * 
         * 
         * Break time shit
         */


        setInterval(() =>{
            console.log('getting shit')
            chrome.runtime.sendMessage({message: 'get-session-details'}, function(response) {
                const session = response;
                if (session.break_time_ongoing) {
                    document.getElementById("break-time-ongoing").style.display = 'block'
    
                }
                else {
                    if ( document.getElementById("break-time-ongoing").style.display === 'block') {
    
                        document.getElementById("break-time-ongoing").style.display = 'none'
                    }
    
                }
    
                if (session.break_is_due) {
                    document.getElementById("break-time-alert").style.display = 'block'
                }
            })
    
        }, 5000)



        /*****
         * 
         * 
         * 
         * 
         * group stuff
         */

        console.log('get settings')

        chrome.storage.sync.get(null, async(settings) => {
            console.log('settings')
            console.log(settings)
            if (settings.GROUPS && settings.GROUPS.length) {
                console.log('grops')
                console.log(settings.GROUPS)
                for (let i = 0; i < settings.GROUPS.length; i++) {
                    const group = settings.GROUPS[i];
                    document.getElementById("focustug-group-select").innerHTML += `
                    <option id="focustug-group-item"> ${group.name}</option>
                `
                }
                
            } 
        })

        

      


        

        setInterval(() => {
            // get time 
            chrome.runtime.sendMessage({message: 'get-time'},function(response) {
                const total = response.total;
                const distraction = response.distraction;

                let total_mins = '';
                let distraction_mins = '';

                if (total < 60) {
                    total_mins = total + ' secs'
                }
                else {
                    total_mins = parseInt(total/60) + ' mins'
                }
                if (distraction < 60) {
                    distraction_mins = distraction + ' secs'
                }
                else {
                    distraction_mins = parseInt(distraction/60) + ' mins'
                }

                document.getElementById('focustug-sessiontime').innerText = total_mins
                document.getElementById('focustug-distractiontime').innerText = distraction_mins
            })
        },1000)

        


        const getSession = () =>  new Promise((resolve, reject)=>{
            chrome.runtime.sendMessage({message: 'get-active-session'}, function(response) {
               return resolve(response)
            })
       })

       const session = await getSession();
       
       if (session) {
        document.getElementById('focustug-main-control').style.display = 'none'
        document.getElementById('focustug-session-control').style.display = 'block'
        document.getElementById('focustug-insight-tab').style.display = 'none'
        document.getElementById('focustug-session-tab').style.display = 'none'
        for (let i = 0; i < document.getElementsByClassName('focustug-control__leaderboard').length; i++) {
            const item = document.getElementsByClassName('focustug-control__leaderboard')[i];

            item.style.display = 'none'
        }

       }


        

        async function register(params) {
            const loading = document.getElementById('focustug-loading');
            document.getElementById('focustug-auth-container').style.display = 'none'
            if (loading) loading.style.display = 'flex'


                await sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/auth/register', "POST", {
                        email: params.register_email,
                        password: params.register_password,
                        name: params.register_name
                    }).then(resp=> {
                        
                        if (resp && resp.data) {
                            // group
                            if (resp.data.group) {
                                
                                chrome.storage.sync.get(null, (settings) => {
                                   let group_list = []
                                   if (settings && settings.GROUPS) {
                                    group_list = settings.GROUPS
                                   }
                                   else {
                                        group_list = []
                                   }

                                   group_list.push(resp.data.group);
                                   

                                   chrome.storage.sync.set({GROUPS: group_list})
                                })
                            }
                            // showToast('success', "Created account successfully")
                            
            
                            login({login_email: params.register_email, login_password: params.register_password})
            
                        }
                        else { 
                            document.getElementById('focustug-auth-container').style.display = 'block'

                            
                        }
                    }).catch(err=> {
                        console.log(e)
                    }).finally(() => {

                    })
 
 

        }
        
        async function login (params) {

            const loading = document.getElementById('focustug-loading');
            document.getElementById('focustug-auth-container').style.display = 'none'

            if (loading) loading.style.display = 'flex'
            await  sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/auth/login', "POST", {
                email: params.login_email,
                password:params.login_password
            }).then(resp=> {
                //alert(resp.data.token)
                if (resp && resp.data && resp.data.token) {
                    
                        chrome.storage.sync.set({auth: {USER_TOKEN: resp.data.token}})
                        chrome.storage.sync.set({credentials: {TRIAL_TO_END: resp.data['user']['trial_to_end'], PLAN: resp.data['user']['plan']}})
            
                        document.getElementById('focustug-auth-container').style.display = 'none';
                        document.getElementById('focustug-main-control').style.display = 'block'
                      
        
                }
                else {
                    document.getElementById('focustug-auth-container').style.display = 'block'

                }
            }).catch(err=> {
                document.getElementById('focustug-auth-container').style.display = 'block'
            })
            .finally(() => {
               loading.style.display = 'none'
            })
        
        }
        

            /*const MAIN_CONTAINER = document.getElementById('focustug-control');

            
            let IS_AUTH_CONTAINER_SHOWING = document.getElementById('focustug-auth-container') && document.getElementById('focustug-auth-container').style.display !== 'none'
            let IS_MAIN_CONTROL_SHOWING = document.getElementById('focustug-main-control') && document.getElementById('focustug-main-control').style.display !== 'none'
            let IS_SESSION_CONTROL_SHOWING = document.getElementById('focustug-session-control') && document.getElementById('focustug-session-control').style.display !== 'none'
            */

            const CONTROL_ELEMENT = document.getElementById('focustug-control')
            const TASK_TEXTAREA_ELEMENT = document.getElementById('focustug-task-textarea')
            const INTENSITY_ELEMENTS = document.getElementsByClassName('focustug-control-section__intensity');
            const START_SESSION_BUTTON = document.getElementsByClassName('focustug-control__startsession')[0];
            const END_SESSION_BUTTON = document.getElementById('end-session-btn');
            let DEFAULT_WORK_TIMES  = ['60', '45', '30', '25', '20', '15', '10', '5']
            let DEFAULT_BREAK_TIMES  = ['60', '45', '30', '25', '20', '15', '10', '5'];
            
            let sampleTaskPlaceHolders = ["Conduct market research to identify potential target markets and evaluate demand for a new service offering"]
            
            
            
            let chosenWorkTime = '60';
            let chosenBreakTime = '15';
                

            //alert(IS_AUTH_CONTAINER_SHOWING)


            // set up auth shit;

            // when register is clicked, get the values;


            const register_email = document.getElementById('focustug-register-email').value
            const register_password = document.getElementById('focustug-register-password').value
            const register_name = document.getElementById('focustug-register-name').value

            const login_container = document.getElementById('focustug-login-container')
            const signup_container = document.getElementById('focustug-signup-container');

            const login_btn = document.getElementById('focustug-login-cta')
            const register_btn = document.getElementById('focustug-register-cta')
            

            // shit stuff
            const switch_to_signup  = document.getElementById('focustug-signup-onboarding');
            const switch_to_login = document.getElementById('focustug-login-onboarding');

            //alert(login_email)

            switch_to_signup.addEventListener('click', (e)  => {
                signup_container.style.display = 'block'
                login_container.style.display = 'none'
            })
            
            switch_to_login.addEventListener('click', (e) => {
                signup_container.style.display = 'none'
                login_container.style.display = 'block'
            })

            login_btn.addEventListener('click',async (e) => {

                e.target.disabled = true;

                const login_email = document.getElementById('focustug-login-email').value
                const login_password = document.getElementById('focustug-login-password').value
               // alert('hey')
               // chrome.runtime.sendMessage({message: 'login', data: {login_email: login_email}});
               await login({login_email, login_password})
               e.target.disabled = false;
            })
            

            register_btn.addEventListener('click', async(e) => {

                e.target.disabled = true;

                const register_name = document.getElementById('focustug-register-name').value
                const register_email = document.getElementById('focustug-register-email').value
                const register_password = document.getElementById('focustug-register-password').value
               // alert('hey')
               // chrome.runtime.sendMessage({message: 'login', data: {login_email: login_email}});
               await register({register_name, register_email, register_password})
               e.target.disabled = false;
            })
            
        
                END_SESSION_BUTTON.addEventListener('click', async function(e) {
                    chrome.runtime.sendMessage({message: 'end-session'}, function(response) {
                        if (response) {
                            document.getElementById('focustug-main-control').style.display = 'block'
                            document.getElementById('focustug-session-control').style.display = 'none'
                        }
                        //remove that popup from everywhere
                        chrome.tabs.query({}).then(tabs=> {
                            for (let tab of tabs) {
                                 chrome.scripting.executeScript( {
                                    target: {
                                        tabId: parseInt(tab.id)
                                    },
                                    func: removePopUp,
                                 }).then((e) => {

                                 })
                            }
                        })
                        
                    })
                })


                START_SESSION_BUTTON.addEventListener('click', async function(e) {
                    const textValue = document.getElementById('focustug-task-textarea') && document.getElementById('focustug-task-textarea')
                    //console.log("value" + textValue.value)
                    const loading = document.getElementById('focustug-loading')

                    loading.style.display = 'flex';
                    e.currentTarget.disabled = true;

                    document.getElementById('focustug-main-control').style.display = 'none'


                    const result =  await sendRequest("https://leapstartlabapi.herokuapp.com/api/v1/sessions/start", "POST", {
                        task : textValue.value
                    })
                    if (result) {

                        loading.style.display = 'none';
    
    
                        document.getElementById('focustug-main-control').style.display = 'none'
                        document.getElementById('focustug-session-control').style.display = 'block'
                            
                        chrome.runtime.sendMessage({
                            message: 'create-session',
                            data: {
                                keywords: result.data,
                                task: textValue.value,
                                work_timer: chosenWorkTime,
                                break_timer: chosenBreakTime
                            }
                        })
                    }
                    e.target.disabled = false;

                        
                    




                    
        
                    
                   
                })
                
                
                
        
        
                // set intensity
                function setSessionIntensity(intensity){
                    chrome.runtime.sendMessage({
                        message: 'set-session-intensity',
                        data: intensity
                    })
                }
            
                 // choose intensity
                 for (let el of INTENSITY_ELEMENTS) {
                    el.addEventListener('click', function(e){
                        for (let element of INTENSITY_ELEMENTS) {
                            element.classList.remove('focustug-intensity-chosen')
                        }
                        e.currentTarget.classList.add('focustug-intensity-chosen')
            
                        if (e.currentTarget.id === 'intensity-hard') setSessionIntensity('intense')
                        if (e.currentTarget.id === 'intensity-mild') setSessionIntensity('mild')
                    })
                }
    
    
    
                // set timer
    
    
                function setTimerDisplays(timerType) {
                    let element = null;
                    if (timerType === 'break') {
                        element = document.getElementById('break-time-display')
                        const minutes = parseInt(chosenBreakTime);
                        if (minutes >= 60) { 
                            let hours = minutes/60
                            if (hours == 1) element.innerText = parseInt(minutes /60) + ' hour'
                            if (hours == 1) element.innerText = parseInt(minutes /60) + ' hours'
                        }
                        else {
                            element.innerText = chosenBreakTime + ' minutes'
                        }
                        
                    }
                    else {
                        element = document.getElementById('work-time-display')
                        const minutes = parseInt(chosenWorkTime);
                        if (minutes >= 60) { 
                            let hours = minutes/60
                            if (hours == 1) element.innerText = parseInt(minutes /60) + ' hour'
                            if (hours == 1) element.innerText = parseInt(minutes /60) + ' hours'
                        }
                        else {
                            element.innerText = chosenWorkTime + ' minutes'
                        }
    
                    }
                }
    
    
                const timerCountrols = document.getElementsByClassName('timer-control');
                
                
                for (let i = 0; i < timerCountrols.length; i++) {
                    const control  = timerCountrols[i];
    
                    control.addEventListener('click', function(e) {
                        const id = e.currentTarget.id;
    
    
                        switch(id) {
                            case 'break-time-increase':
                                // increase break time
                                if (DEFAULT_BREAK_TIMES.indexOf(chosenBreakTime) !== 0) {
                                    chosenBreakTime =  DEFAULT_BREAK_TIMES[ DEFAULT_BREAK_TIMES.indexOf(chosenBreakTime) - 1]
                                    setTimerDisplays('break')
                                }
                        
                                break;
    
                            case 'break-time-decrease': 
                                if (DEFAULT_BREAK_TIMES.indexOf(chosenBreakTime) !== DEFAULT_BREAK_TIMES.length-1) {
                                    chosenBreakTime =  DEFAULT_BREAK_TIMES[ DEFAULT_BREAK_TIMES.indexOf(chosenBreakTime) + 1]
                                    setTimerDisplays('break')
    
                                }
                                break;
    
                            case 'work-time-increase':
                                if (DEFAULT_WORK_TIMES.indexOf(chosenWorkTime) !== 0) {
                                    chosenWorkTime =  DEFAULT_WORK_TIMES[ DEFAULT_WORK_TIMES.indexOf(chosenWorkTime) - 1]
                                    setTimerDisplays('work')
    
                                }
                                break;
    
                            case 'work-time-decrease':
                                if (DEFAULT_WORK_TIMES.indexOf(chosenWorkTime) !== DEFAULT_WORK_TIMES.length-1) {
                                    chosenWorkTime =  DEFAULT_WORK_TIMES[ DEFAULT_WORK_TIMES.indexOf(chosenWorkTime) + 1]
                                    setTimerDisplays('work')
    
                                }
                                break;
                        }
                    })
                }








            
           
           
            
            
            
            
            
            
            
            

        
            const lead = document.getElementsByClassName('foctug-popup__lead')[0];
            const container = document.getElementsByClassName('foctug-popup')[0];
            const popup_items = document.getElementsByClassName('foctug-popup__item')

            /*
            if (lead) {
                lead.addEventListener('mouseover', function() {
                    // tray;
                    const tray = document.getElementsByClassName('foctug-popup__tray')[0];
                    tray.style.height = 'auto';
            
                    for (let item of popup_items) {
            
                      
                            item.style.height= '50px';
                        
                    }
                })
                container && container.addEventListener('mouseleave', function() {
                    // tray;
                    const tray = document.getElementsByClassName('foctug-popup__tray')[0];
                    tray.style.height = '0';
                    for (let item of popup_items) {
                      
                        item.style.height= '0';
            
                    }
            })



        } */
        
    
    
    
        
    }catch(e) {
        throw e
    }
}





chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
    if (message.message === 'create-session') {
        console.log(JSON.stringify(message))
        await createSession(message.data)
    }
    else if (message.message === 'login') {
        await login(data)
    }
    else if (message.message === 'register') {
        await createSession(message.data)
    }

   
    
})




async function register (params) {
   await sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/auth/register', "POST", {
            email: params.register_email,
            password: params.register_password,
            name: params.register_name
        }).then(resp=> {
            
            if (resp && resp.data) {

               // showToast('success', "Created account successfully")

                login(register_email, register_password)

            }
            else { 
                
            }
        }).catch(err=> {
            console.log(e)
        }).finally(() => {
        })

}

 async function createSession(params) {
    

        SESSION.task = params.task
        SESSION.keywords = params.keywords
        SESSION.work_timer = params.work_timer,
        SESSION.break_timer = params.break_timer
        showPopUp();
        //start workTimer();
        //sart breakTime
    
    
        startWorkTimer()
        chrome.runtime.sendMessage({message: 'session-created'});
        setPercentageCalculationTime()

        INTERVALS.total_work_time_interval = setInterval(() => {
            SESSION.total_work_time++
        }, 1000)
    

    return true;

    // showPopUp()




}


async function setPercentageCalculationTime() {
    INTERVALS.percentage_calculation_interval = setInterval(() => {
        let percentage  =0;
        let total_work_time = SESSION.total_work_time;
        let total_distraction_time = SESSION.total_distraction_time;
        
            
                    if (total_work_time) {

                    }
                
                    console.log('calculated percentage ' +  total_work_time + total_distraction_time)
                    percentage = total_work_time/(total_work_time + total_distraction_time) * 100
                    console.log('calculated percentage =' + percentage)
                    GLOBALS.focus_percentage = parseFloat(percentage).toFixed(1)
        
                    console.log(GLOBALS.focus_percentage)
         
            //chrome.runtime.sendMessage({message: 'revaluate-distraction-percentage', data: {percentage}})
        
        
        
    }, 5000);

}



function isActiveTab(tab_id) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true}).then(tabs=> {
            resolve(tab_id === tabs[0].id)
        })
    })
}


chrome.tabs.onCreated.addListener(async (tab, changeInfo) => {
    if (SESSION.task && !SESSION.break_time_ongoing) {
            //endTimeSpent(SESSION.previous_tab_id)
        await stopTotalDistractionTimeCounter(SESSION.previous_tab_id)

        SESSION.previous_tab_id = tab.id;

    
        registerTab(tab);

        try {
            showPopUp();
        }catch(e){

        }
     


    }



});


chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) =>{
    console.log('onUpdated')
    await stopTotalDistractionTimeCounter(SESSION.previous_tab_id)

    registerTab(tabId)

    SESSION.previous_tab_id = tabId;
    chrome.scripting.executeScript({
        target: {
            tabId: parseInt(tabId)
        },
        //files : [ "parn.js"],
        func: loadBodyExtractionScript,
        args: [true],

    })
    try {
        if (SESSION.task) {

            showPopUp();
        }
    }catch(e){
        console.log('ser')
    }
})


function showBlocker(tab) {




    // an idiot</div>`;
    const modal_div = document.createElement('div');
    modal_div.classList.add('blocker-modal');
    modal_div.classList.add('blocker-modal-red');
    modal_div.style.height = '100%';
    modal_div.style.width = '100%';
    modal_div.style.position = 'fixed';




    document.body.prepend(modal_div)

    let message_tone = 'normal'

    chrome.storage.sync.get(null, (settings) => {
        //message_tone = settings && settings.settings && settings.settings["TONE"] || 'normal'
    })

    let message = ''

    try {
        message = randomBlockerMessage(message_tone)
    } catch (e) {

    }

    modal_div.innerHTML += `
    <div class="blocker-modal-container">
        <div class="blocker-modal-logo" style="display: flex; align-items: center;">
            <svg width="20" height="20" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 10C0 4.47715 4.47715 0 10 0H37.9677C43.4905 0 47.9677 4.47715 47.9677 10V38C47.9677 43.5229 43.4905 48 37.9677 48H23.9838H10C4.47716 48 0 43.5229 0 38V10Z" fill="#4ECB71"/>
                <path d="M32.6928 34.5024C35.1528 37.3011 37.4444 39.6939 38.2807 34.9291C39.117 30.1643 37.7289 29.0158 34.3481 26.2936C33.187 25.3586 32.0116 24.7532 30.9687 24.3613C28.7563 23.53 27.5428 25.2327 28.6962 27.7765C29.7827 30.1728 31.3655 32.9923 32.6928 34.5024Z" fill="white"/>
                <path d="M34.7537 32.1024C32.6837 25.6766 30.3841 26.4721 29.2701 24.5241" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M34.7537 32.1024C32.6837 25.6766 30.3841 26.4721 29.2701 24.5241" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M24.8784 35.8346C23.2667 38.6333 21.7653 41.026 21.2174 36.2612C20.6695 31.4965 21.5789 30.348 23.7939 27.6257C24.4684 26.7967 25.1502 26.2268 25.7724 25.8351C27.3952 24.8135 28.2536 26.6265 27.3995 29.4323C26.6926 31.7543 25.7091 34.392 24.8784 35.8346Z" fill="white"/>
                <path d="M23.5325 33.4347C24.8887 27.0088 26.3954 27.8044 27.1252 25.8564" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M23.5325 33.4347C24.8887 27.0088 26.3954 27.8044 27.1252 25.8564" stroke="#F4F4F4" stroke-width="1.5" stroke-linecap="round"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M19.7549 22.8415L0.0352374 24.2667L0.0351562 26.5455L21.9304 25.0184L19.7549 22.8415ZM21.1609 22.7399L23.3396 24.9201L48.0022 23.2V20.8L21.1609 22.7399Z" fill="white"/>
                <path d="M28.839 20.1841C29.726 19.6908 30.7126 20.0934 31.0425 21.0832Lnan nanL31.0425 21.0832C31.3724 22.0731 30.9207 23.2754 30.0337 23.7687L26.967 25.4741C26.08 25.9674 25.0935 25.5648 24.7636 24.575Lnan nanL24.7636 24.575C24.4337 23.5851 24.8853 22.3828 25.7724 21.8895L28.839 20.1841Z" fill="white"/>
                </svg>

                <p style="margin-left: 8px; color: white; font-size: 20px;">FocusTug</p>
                
        </div>

        <div>

            <div  class="blocker-header-message" style="color: white !important">
                ${message}

            </div>

            

            

        </div>



        <div class="blocker-bottom"> 
                <!--<button>Ignore once</button>--->
        </div>
    </div>`
    // set timer for seconds
    let initial_seconds = 10;
    let interval = null;
    try {
        


    } catch (e) {

    }

    // create close button listener

    
}

chrome.tabs.onActivated.addListener(async (tab, changeInfo, ) => {
    if (SESSION.task && !SESSION.break_time_ongoing) {
        try {
            showPopUp();
        }catch(e){
            
        }
        if (SESSION.previous_tab_id) {

           await stopTotalDistractionTimeCounter(SESSION.previous_tab_id)
        }

        SESSION.previous_tab_id = tab.tabId
        
        const tabExists = SESSION.tabs.find(t=> parseInt(t.id) === parseInt(tab.tabId));
        console.log(tabExists)

        console.log(tabExists)
        if (!tabExists) {
            registerTab(tab)
        }
        chrome.tabs.get(parseInt(tab.tabId), async (t) => {
            tab = t
            let host = new URL(tab.url).hostname;
            let splitt = host.split('www.');
            if (splitt && splitt.length > 1) {
                host = splitt[1]
            }

            if (SESSION.evaluatedHosts[host] === 'distraction') {
                await initializeTotalDistractionTimeCounter(tab.id)


                if (SESSION.intensity === 'intense') {
                    // show blocker
                    chrome.scripting
                        .executeScript({
                            target: {
                                tabId: tab.id
                            },
                            //files : [ "blocker.js"],
                            func: showBlocker,
                            args: [tab.id]

                        })
                        .then(async (e) => {
                           // await stopTotalDistractionTimeCounter(tab.id)
                        }).catch(e => {

                        });
                }
            }

            else if (SESSION.evaluatedPages[tab.url] === 'distraction') {
                await initializeTotalDistractionTimeCounter(tab.id)
                if (SESSION.intensity === 'intense') {
                    // show blocker
                    chrome.scripting
                        .executeScript({
                            target: {
                                tabId: tab.id
                            },
                            //files : [ "blocker.js"],
                            func: showBlocker,
                            args: [tab.id]

                        })
                        .then(async(e) => {
                           // await stopTotalDistractionTimeCounter(tab.id)

                        }).catch(e => {

                        });
                }

            } 
            else if (SESSION.evaluatedHosts[tab.url] === 'task') {
                stopTotalDistractionTimeCounter(tab.id)
            }
            else {

               // computePageRelevance(tab, {})

               try {
        
                    chrome.scripting.executeScript({
                        target: {
                            tabId: parseInt(tab.id)
                        },
                        //files : [ "parn.js"],
                        func: loadBodyExtractionScript,
                        args: [false],
            
                    })
                        
                }catch(e) {
                    console.log(e)
                }
        
            }
        })


        


    }

})

function registerTab(tab) {
    if (SESSION.task) {
        if (typeof(tab) === 'number') {
            chrome.tabs.get(parseInt(tab), function(t) {
                SESSION.tabs.push({id: t.id, relevance: null, classification: null})//

            })
        }
        else {

            SESSION.tabs.push({id: tab.tabId, relevance: null, classification: null})//
            console.log(SESSION.tabs)
        }
        //computePageRelevance
    }
    
}

chrome.runtime.onMessage.addListener((message)=> {

})
 
async function computePageRelevance(tab, data) {
    if (SESSION.task && !SESSION.break_time_ongoing) {
        let tabId = tab.id || tab.tabId
        chrome.tabs.get(parseInt(tabId), async (t) =>{
            tab = t;
            let host = new URL(tab.url).hostname;
            let splitt = host.split('www.');
            if (splitt && splitt.length > 1) {
                host = splitt[1]
            }

            let shouldCompute = false;



            if (SESSION.evaluatedPages[tab.url] === 'distraction'){
                console.log('evaluated page found')
                initializeTotalDistractionTimeCounter(tab.id)

                if (SESSION.intensity === 'intense') {
                    chrome.scripting
                    .executeScript({
                        target: {
                            tabId: tabId
                        },
                        //files : [ "blocker.js"],
                        func: showBlocker,
                        args: [tabId]

                    })
                    .then(async(e) => {
                       

                    }).catch(e => {

                    });
                }
                // do nothing
            }
            else {
                shouldCompute = true;
            }






            if (shouldCompute === true) {
                console.log('computing')
                const requestBody = {
                    keywords: SESSION.keywords,
                    title: tab.title,
                    task: SESSION.task
                    
                }
                if (data.description) {
                    requestBody.description = data.description
                }
                if (data.body) {
                    requestBody.body = data.body
                }
                // check 
                //send the name, description and shit to 
                const result = await sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/sessions/rel', "POST", requestBody);
                const relevance  = result.data;

                if (relevance) {

                    SESSION.tabs.find(t=> t.id === tab.id).relevance = parseFloat(relevance)

                    let classification = parseFloat(relevance) > 0.78 ? 'task' : 'distraction';


                    SESSION.tabs.find(t=> t.id === tab.id).classification = classification
                    SESSION.evaluatedHosts[host] = classification
                    SESSION.evaluatedPages[tab.url] = classification

                    // if is activeTab
                    let activeTab = await  isActiveTab(tab.id)
                    if (classification == 'distraction') {
                        console.log('isActiveTab')
                        initializeTotalDistractionTimeCounter(tab.id)
                        console.log('distraction found should block')

                        if (SESSION.intensity === 'intense') {

                            chrome.scripting
                            .executeScript({
                                target: {
                                    tabId: tabId
                                },
                                //files : [ "blocker.js"],
                                func: showBlocker,
                                args: [tabId]
    
                            })
                            .then(async (e) => {
                               // await stopTotalDistractionTimeCounter(tab.id)

                            }).catch(e => {
    
                            });
                        }
                        
                        let distracting_host = GLOBALS.distracting_hosts[host]

                        if (!distracting_host) {
                            
                            const obj = {host: host, time: 0}
                            
                            GLOBALS.distracting_hosts[host] = {time: 0}

                        }
                    }else {
                        stopTotalDistractionTimeCounter()
                    }

                    
                }
                
                
                
                ///NOTE: add to evaluated pages && host


                console.log(SESSION)
            }
        })

    }
    

    
}


function initializeBreakTime() {
    console.log('initializeBreakTime')

    if (SESSION.task && SESSION.break_timer) {
        let frequency_in_mins = SESSION.break_timer_interval
        if (frequency_in_mins) {
            frequency_in_mins = parseInt(frequency_in_mins);
            let frequency_in_milliseconds = null;
            console.log('initializeBreakTime frequency in mins ' + frequency_in_mins)

            frequency_in_milliseconds = frequency_in_mins * 60 * 1000;
            GLOBALS.break_timer_interval = setInterval(() => {
                handleBreakDue()
            }, 10000) // frequency_in_milliseconds)
        }

    }
}

function startWorkTimer() {
    clearInterval(INTERVALS.break_timer_interval)

    // in seconds
    if (SESSION.work_timer) {
        console.log('started work timer')
        // in seconds = 
        const seconds = parseInt(SESSION.work_timer)  * 60000;
        
        
        INTERVALS.work_timer_interval =  setInterval(() => {
            //start break
            clearInterval(INTERVALS.work_timer_interval)
            console.log('should be break time')
            console.log(INTERVALS.work_timer_interval)



           // startBreak()
           handleBreakDue()

            
            
            
        }, seconds)

        console.log(SESSION)
    }
}


function startBreakTimer() {

    if (SESSION.break_timer) {
        clearInterval(INTERVALS.work_timer_interval)
        INTERVALS.work_timer_interval = null;
        console.log("started break")

        SESSION.break_is_due =true;
        SESSION.break_time_ongoing = true;
        


        const seconds = parseInt(SESSION.break_timer) * 60000
        INTERVALS.break_timer_interval = setInterval(()=> {
            // start break timer,
            // set flags;
            SESSION.break_is_due = false;
            SESSION.break_time_ongoing = false;

            startWorkTimer()
           
        }, seconds)

        console.log(SESSION)
    }
}



async function sendRequest(url, method, body, headers = {}) {
    try {

        return await fetch(url, {
            method,
            body: JSON.stringify(body),
            headers: {
                ...headers,
                "Content-Type": 'application/json'
            }
        }).then(resp => {
            return resp.json()
        })
    } catch (e) {}
}


