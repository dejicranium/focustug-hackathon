//const FREE_PASS = ["chrome://", "google.com"]
const VERSION = "0.1";
let NEW_VERSION = "0.1"
let PLAN_EXPIRED = false;



const GLOBALS = {
    intervals: {},
    previousTabId: null,
    activeId: null,
    active: {},

    run_initial_removal: false,

    activeSession: null,
    active_intervals: 0,

    total_task_time: 0,
    total_task_time_interval: null,

    total_distraction_time: 0,
    total_distraction_time_interval: null,

    break_time_interval: null,
    break_due_interval: null,

    check_latest_version_interval: null,
    remove_excess_tabs_interval: null,

    delete_past_tasks_interval: null
}


let DISTRACTIONS_COUNTER = 0;
let TASKS_CLOSED = 0;
let DISTRACTIONS_CLOSED = 0;
let DISTRACTIONS_IGNORED = 0;

let BREAK_TIME_DUE = false;
let BREAK_TIME_ONGOING = false;
let BREAK_TIME_LEFT = 0;


let USER_TOKEN = ''




originalSetInterval = setInterval;
originalClearInterval = clearInterval;

setInterval = function(func, delay) {
    GLOBALS.active_intervals++;
    return originalSetInterval(func, delay);
};

clearInterval = function(timerID) {

    GLOBALS.active_intervals--;
    originalClearInterval(timerID);
};




let INTERVALS = {

};

let TIME_DECAY = {

};

let TASKS = {

}

let TIME_SPENT = {

}



let WEEK_STATS = {

}

let DISTANCE_SCROLLED = {

}
let CLICKS = {

}

let SESSION = {
    id: '',
    previous_tab_id: null,
    data: '',
}


function increaseDayStats(stat, by=1) {
    try {

        const date = new Date();
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate()
        const date_string = `${year}-${month}-${day}`
    
    
        if (!WEEK_STATS[date_string]) {
            WEEK_STATS[date_string] = {
                total_distraction_time: 0,
                total_task_time: 0,
                distractions_ignored: 0,
                distractions_detected: 0,
                distractions_closed: 0,
            }
        }
        WEEK_STATS[date_string][stat] +=by;
    
    }catch(e) {
        throw e
    }
}

function initializeWeeklyAnalytics() {
    // if it's a sunday, recreat
    const day_of_week = new Date().getDay()
    if (day_of_week === 0) {
        // if it's a sunday, restart
        WEEK_STATS = {}
    
    }
        // if this is the first time user using extension and there's no previous data, populate it with data 
        // starting from today to the eend of the week 
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate()
    const date_string = `${year}-${month}-${day}`
    
    WEEK_STATS[date_string] = {
        distraction_time: 0,
        total_time: 0,
        distractions_ignored: 0,
        distractions_detected: 0
    }
    
}



function initializeDayStatistics() {
     // check if day exists in weekly stats
     // set an interval for every six hours to find if it's a new day
     // we want to make sure that it resets every sunday
     const twentyFourHours = 86400000;
     const date = new Date();
     const year = date.getUTCFullYear();
     const month = date.getUTCMonth();
     const day = date.getUTCDate()
     const date_string = `${year}-${month}-${day}`


    setInterval(() => {
        const day = new Date().getUTCDay();

        if (day === 0) {

            WEEK_STATS = {};

            // reset the week stats
            WEEK_STATS[date_string] = {
                distraction_time: 0,
                total_time: 0,
                distractions_ignored: 0,
                distractions_detected: 0
            }
        } 
    }, twentyFourHours)
}

chrome.runtime.onInstalled.addListener(function(details) {
    activateDeletePastTasks()
    initializeDayStatistics()

    if (GLOBALS.check_latest_version_interval === null) {
        console.log('starting lastest version')
        const six_hours_in_milliseconds = 21600000;

        try {
            GLOBALS.check_latest_version_interval = setInterval(async () => {
                console.log('running latest version')
                let new_version = await getLatestVersion();

                if (new_version && new_version.data && new_version.data.length === 3) {
                    NEW_VERSION = new_version.data
                    console.log(NEW_VERSION)
                    console.log(VERSION)
                    if (NEW_VERSION !== VERSION) {
                        console.log('sending latest version')

                    }

                }
            }, six_hours_in_milliseconds)
        } catch (e) {
            //throw e
        }
    }
});


async function activateDeletePastTasks() {
    const hours48 = 172800000;

    GLOBALS.delete_past_tasks_interval = setInterval(()=> {
        Object.keys(TASKS).forEach(task=>{
            if (task && task.ended_at) {
                const now = new Date().getHours();
                const ended = new Date(task.ended_at).getHours()

                if (now - ended >= 48) {
                    // delete 
                   delete TASKS[task]
                }
            }
        })
    }, hours48 )
}

async function getLatestVersion() {
    return await sendRequest("https://leapstartlabapi.herokuapp.com/api/v1/updates/version", "GET")
}


function initializeBreakTime() {
    console.log('initializeBreakTime')

    if (SESSION.id && SESSION.break_time) {
        let frequency_in_mins = SESSION.break_time.frequency;
        if (frequency_in_mins) {
            frequency_in_mins = parseInt(frequency_in_mins);
            let frequency_in_milliseconds = null;
            console.log('initializeBreakTime frequency in mins ' + frequency_in_mins)

            frequency_in_milliseconds = frequency_in_mins * 60 * 1000;
            GLOBALS.break_due_interval = setInterval(() => {
                handleBreakDue()
            }, frequency_in_milliseconds) // frequency_in_milliseconds)
        }

    }
}

function handleBreakDue() {
    console.log('handleBreakDue')
    // set Break due and show a prompt that asks user if they want to start a break;
    // show modal
    BREAK_TIME_DUE = true;

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
                <div class="blocker-modal-logo" style="display: flex !important; align-items: center !important; margin-bottom: 10px">
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

                        <!--<img style="width: 100%; height: 100%; object-fit: contain" src="https://thumbs2.imgbox.com/62/89/RZO57w9n_t.png" alt="">-->
                    </div>
                    <div  id="blocker-close-message" class="blocker-header-message" style="color: white">
                        It's break time!!!

                    </div>


                    
                    
                    <div style="display: flex; flex-direction: column; width: 300px; margin:auto; align-items:center">
                        <button id="start-break-btn" style="min-width: 300px; font-size: 16px !important; 
                            background: #4ECB71 !important; margin-bottom: 24px; margin-right: 16px; 
                            padding: 16px; border-radius: 5px;
                            border: 2px solid #4ECB71; color: black" class="blocker-close-cta"> Start Break</button>
                        <button id="suspend-break-btn" style=" 
                            min-width: 300px;  font-size: 16px !important; 
                            margin-bottom: 24px; margin-right: 16px; 
                            border: 2px solid #A90F3D; 
                            padding: 16px; border-radius: 5px;
                            color: white !important; 
                            background-color: #A90F3D !important" class="blocker-close-cta"> Postpone Break</button>
                    </div>

                </div>



                <div class="blocker-bottom"> 
                        <!--<button>Ignore once</button>--->
                </div>
            </div>
        </div>
        `


        document.getElementById('start-break-btn').addEventListener('click', ()=> {
            chrome.runtime.sendMessage({message: 'start-break'})
            modal_div.style.display = 'none'

        })

        document.getElementById('suspend-break-btn').addEventListener('click', () => {
            modal_div.style.display = 'none'
        })
}


function startBreak() {
    console.log('start break background')
    BREAK_TIME_ONGOING = true;
    BREAK_TIME_DUE = false;

    // duration 
    let duration_in_min = SESSION.break_time.duration;
    let duration_in_milliseconds = duration_in_min * 60 * 1000;
    BREAK_TIME_LEFT = duration_in_milliseconds;


    GLOBALS.break_time_interval = setInterval(() => {
        BREAK_TIME_LEFT -= 60000;
        chrome.runtime.sendMessage({
            message: 'break-time-left',
            data: {
                left: BREAK_TIME_LEFT
            }
        })
    }, 60000)

    clearInterval(GLOBALS.total_distraction_time_interval)
    clearInterval(GLOBALS.total_task_time_interval)



    setTimeout(() => {
        duration_in_min = parseInt(duration_in_min);
        console.log('initializeBreakTime duration in mins ' + duration_in_min)

        duration_in_milliseconds = duration_in_min * 60 * 1000;
        endBreak()
    }, duration_in_milliseconds)


}

function endBreak() {
    BREAK_TIME_LEFT = 0;
    BREAK_TIME_DUE = false;
    BREAK_TIME_ONGOING = false;

    clearInterval(GLOBALS.break_time_interval)
    initializeBreakTime()
    try {

        GLOBALS.total_task_time_interval = setInterval(() => {
            GLOBALS.total_task_time++;


            const date = new Date();
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth() + 1;
            const day = date.getUTCDate()
            const date_string = `${year}-${month}-${day}`



          
            
                WEEK_STATS[date_string].total_task_time++;

            

            chrome.runtime.sendMessage({
                message: 'total-task-time',
                data: {
                    time: GLOBALS.total_task_time
                }
            })

        }, 1000)
    } catch (e) {

    }


}
// start session
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.message === 'restart-session') {
        let session = message.data.id;
        session = TASKS[session];
        const time = new Date().getTime()

        SESSION.id = "tsk_" + time;
        SESSION.summary = session.summary
        SESSION.name = session.name
        SESSION.break_time = session.break_time;


        // activate the active tab
        chrome.tabs.query({
            active: true
        }).then((tabs) => {
            let tab = tabs[0]
            onTabActivated(tab)

        })


        // restore closed task tabs
        chrome.tabs.query({}).then(tabs=> {

            for (tab of TASKS[message.data.id].tabs.filter(t=> t.classification === 'task')) {
                console.log('tab from classification')
                console.log(tab)
                const tab_exists = tabs.find(t => t.url  === tab.full_url);
                if (!tab_exists) {
                    chrome.tabs.create({url: tab.full_url})
                }
            }
        })


        TASKS[SESSION.id] = {
            tabs: [],
            hosts: [],
            visited_urls: {


            },
            visited_hosts: {

            },
            id: SESSION.id,
            task: session.name,
            summary: session.summary,
            created: time,
        }





        // start total task time
        try {

            GLOBALS.total_task_time_interval = setInterval(() => {
                GLOBALS.total_task_time++;
                chrome.runtime.sendMessage({
                    message: 'total-task-time',
                    data: {
                        time: GLOBALS.total_task_time
                    }
                })

                increaseDayStats('total_task_time', 1)

            }, 1000)

            setTimeout(() => {
                calculateTabsRating()
            }, 1000)
        } catch (e) {

        }

        if (SESSION.break_time && SESSION.break_time.frequency) {
            initializeBreakTime();
        }

        

    }
    if (message.message === 'create-active-session') {
        // split to get the message id

      

        chrome.action.setBadgeText({text: "A"});
        chrome.action.setBadgeBackgroundColor({color: "teal"})

        chrome.storage.sync.get(null, (settings) => {
            USER_TOKEN = settings && settings.auth && settings.auth.USER_TOKEN;
        })


        const time = new Date().getTime();
        const message_id = message.task_id
        const task_name = message.task
        //chrome.storage.local.set({'activeSession': message_id})
        SESSION.id = message_id
        SESSION.summary = message.summary
        SESSION.name = message.task_name
        SESSION.break_time = message.break_time
        SESSION.created = time
        SESSION.token = message.token

        console.log('break time')
        console.log(SESSION.break_time)

        TASKS[SESSION.id] = {
            tabs: [],
            hosts: [],
            visited_urls: {


            },
            visited_hosts: {

            },
            id: SESSION.id,
            task: task_name,
            summary: message.summary,
            created: time,
        }


        // activate the active tab
        chrome.tabs.query({
            active: true
        }).then((tabs) => {
            let tab = tabs[0]
            onTabActivated(tab)

        })





        // start total task time
        try {

            GLOBALS.total_task_time_interval = setInterval(() => {
                GLOBALS.total_task_time++;
                chrome.runtime.sendMessage({
                    message: 'total-task-time',
                    data: {
                        time: GLOBALS.total_task_time
                    }
                })


             



                increaseDayStats('total_task_time', 1)

            }, 1000)

            setTimeout(() => {
                calculateTabsRating()
            }, 1000)
        } catch (e) {

        }

        if (SESSION.break_time && SESSION.break_time.frequency) {
            initializeBreakTime();
        }



    } else if (message.message == 'document-scrolled') {
        const scroll_value = message.scroll_value
        const document_height = message.document_height

        // get active tab
        if (!DISTANCE_SCROLLED[SESSION.previous_tab_id]) {
            DISTANCE_SCROLLED[SESSION.previous_tab_id] = {
                cumulative: 0,
                value: 0
            };
        }

        if (scroll_value && document_height) {
            DISTANCE_SCROLLED[SESSION.previous_tab_id].cumulative += scroll_value;
            DISTANCE_SCROLLED[SESSION.previous_tab_id].value = DISTANCE_SCROLLED[SESSION.previous_tab_id].cumulative / document_height;

        }

    } else if (message.message === 'document-clicked') {
        if (!CLICKS[SESSION.previous_tab_id]) {
            CLICKS[SESSION.previous_tab_id] = 1;
        }
        CLICKS[SESSION.previous_tab_id]++;
    } else if (message.message === 'is-active-session') {
        let queryOptions = {
            active: true,
            currentWindow: true
        };
        let tabs = await chrome.tabs.query(queryOptions);

        chrome.tabs.sendMessage(tabs[0].id, {
            message: "active-session",
            data: SESSION.id
        }, );
    } else if (message.message === 'close-tab') {

        closeTab(message.data.tab_id, 'distraction')

    } else if (message.message === 'get-distraction-counter') {} else if (message.message === 'search-closed-tabs') {
        const search_term = message.data.search_term;


        // search
        const results = TASKS[SESSION.id].tabs.filter(tab => tab.closed === true && (tab.url.indexOf(search_term) > -1 || tab.title.indexOf(search_term) > -1));


        chrome.runtime.sendMessage({
            message: 'closed-tabs-search-results',
            data: {
                results
            }
        })
    }else if (message.message === 'plan-upgraded') {

        chrome.action.setBadgeBackgroundColor({color: "lightred"})
        chrome.action.setBadgeText({text: "A"})

        PLAN_EXPIRED = false
    }
    else if (message.message === 'popup') {
        chrome.runtime.sendMessage({message: 'plan-expired', data: {expired: PLAN_EXPIRED}});

        chrome.runtime.sendMessage({
            message: 'total-distraction-time',
            data: {
                time: GLOBALS.total_distraction_time
            }
        })
        chrome.runtime.sendMessage({
            message: 'total-task-time',
            data: {
                time: GLOBALS.total_task_time
            }
        })
        chrome.runtime.sendMessage({
            message: 'distractions-closed',
            data: {
                count: DISTRACTIONS_CLOSED
            }
        })
        chrome.runtime.sendMessage({
            message: 'distractions-count',
            data: {
                count: DISTRACTIONS_COUNTER
            }
        })
        if (SESSION.break_time) {

            chrome.runtime.sendMessage({
                message: 'break-time-due',
                data: {
                    due: BREAK_TIME_DUE,
                    duration: SESSION.break_time.duration
                }
            })
        }
        chrome.runtime.sendMessage({
            message: 'is-break-time',
            data: {
                break_time: BREAK_TIME_ONGOING
            }
        })
        chrome.runtime.sendMessage({
            message: 'break-time-left',
            data: {
                left: BREAK_TIME_LEFT
            }
        })

        chrome.runtime.sendMessage({
            message: 'recent-tasks',
            data: {
                tasks: TASKS
            }
        })
        chrome.runtime.sendMessage({
            message: 'new-version-exists',
            data: {
                new: NEW_VERSION !== VERSION
            }
        })

    } else if (message.message === 'start-break') {
        startBreak()

    } else if (message.message === 'end-break') {
        endBreak()

    }


});

function initializeTotalDistractionTimeCounter(tabId) {
    try {

        clearInterval(INTERVALS['total_distraction_time_for_' + tabId])

        if (SESSION.id && !BREAK_TIME_ONGOING) {

            INTERVALS['total_distraction_time_for_' + tabId] = setInterval(() => {
                GLOBALS.total_distraction_time++;
    
    
    
    
    
                
                chrome.runtime.sendMessage({
                    message: 'total-distraction-time',
                    data: {
                        time: GLOBALS.total_distraction_time
                    }
                })
    
    
                increaseDayStats('total_distraction_time', 1)
    
                 
              
               
    
    
    
               
    
            }, 1000)
        }

    } catch (e) {
        //console.log(e)
    }


}

function stopTotalDistractionTimeCounter(tabId) {
    try {

        clearInterval(INTERVALS['total_distraction_time_for_' + tabId]);
        INTERVALS['total_distraction_time_for_' + tabId] = null
    } catch (e) {
        throw e
    }
}


function initializeTimeSpent(tab) {
    if (SESSION.id) {

        const tab_id = tab.id || tab.tabId;
        try {

            INTERVALS[tab_id] = setInterval(() => {
                if (!TIME_SPENT[tab_id]) {
                    TIME_SPENT[tab_id] = 0
                }

                TIME_SPENT[tab_id] += 1


            }, 1000)
        } catch (e) {

        }
    }
}

function endTimeSpent(tab_id) {

    if (INTERVALS[tab_id]) {
        clearInterval(INTERVALS[tab_id]);
        INTERVALS[tab_id] = false;
    }
}

function registerTab(tab) {
    // see if tab already exists in the current session;
    let tab_id = tab.id || tab.tabId;
    let tab_details = tab;

    if (TASKS[SESSION.id]) {
        const tab = TASKS[SESSION.id].tabs.find(tab => tab.id == tab_id);
        if (!tab) {
            const new_tab_object = {
                id: tab_id,
                opened_for: 0,
                created: new Date().getTime(),
                last_opened: new Date().getTime(),
                reopened_times: 0,
                last_page: '',
                time_spent_in: 0,
                closed: false,
                closed_at: null,
                closed_reason: '',
                rating: 0,
                classification: 'task',
                relevance: null,
                full_url: tab_details.url
            }


            TASKS[SESSION.id].tabs.push(new_tab_object)
        }
    }
}

function onRemoveTab(tab_id) {
    if (TASKS[SESSION.id]) {
        const tab = TASKS[SESSION.id].tabs.find(tab => tab.id == tab_id);
        if (tab) {
            // const index = TASKS[SESSION.id].tabs.indexOf(tab);
            //TASKS[SESSION.id].tabs.splice(index, 1)
        }

        setTimeout(() => {
            delete TIME_SPENT[tab_id]
            delete INTERVALS[tab_id]
            delete CLICKS[tab_id]
            delete DISTANCE_SCROLLED[tab_id]
        }, 3000)

    }
}

async function calculateTabsRating(start_interval = true) {
    if (SESSION.id) {

        chrome.storage.sync.get(null, async (settings) => {

            const OPTIMAL_TABS = settings && settings.settings && settings.settings.OPTIMAL_TABS || 7;

            // first remove all the distractions

            if (GLOBALS.run_initial_removal === false) {

                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (!TASKS[SESSION.id].tabs.find(t => parseInt(t.id) === tab.id)) {
                            chrome.scripting
                                .executeScript({
                                    target: {
                                        tabId: tab.id
                                    },
                                    files: ["events.js"],
                                    //func: showBlocker,
                                    //rgs: [host, tabId]

                                })
                                .then((e) => {


                                }).catch(e => {


                                })


                        }
                        registerTab(tab)

                        computePageRelevance(tab)



                    })
                    GLOBALS.run_initial_removal = true;
                })

            }



            // then if the optimal tabs is still higher than the ones available, do the calculation
             GLOBALS.remove_excess_tabs_interval = setInterval(async () => {

                let tabs_no = 0
                await chrome.tabs.query({}, (tabs) => {
                    tabs_no = tabs.length

                    if (tabs_no > OPTIMAL_TABS) {
                        // count for the differnce
                        const difference = tabs_no - OPTIMAL_TABS;


                        // if
                        const tabs_array = []
                        let obj = {};
                        tabs = TASKS[SESSION.id] && TASKS[SESSION.id].tabs && TASKS[SESSION.id].tabs.filter(t=> tabs.map(ta=> ta.id).includes(t.id));
                        if (tabs) {
                            tabs.forEach(tab => {
                                const clicks = CLICKS[tab.id] || 1;
                                const time_spent = TIME_SPENT[tab.id] || 1;
                                const scroll_value = DISTANCE_SCROLLED[tab.id] && DISTANCE_SCROLLED[tab.id].value || 1;
                                

                                console.log('scroll value')
                                console.log(scroll_value)
                                let time_decay = computeTimeDecay(tab);
                                const rating = (clicks + time_spent + scroll_value) * time_decay
                                console.log('rating is')
                                console.log(rating)
                                

                                //console.log('clicks ' + clicks + " time spent " + time_spent + "scroll value " + scroll_value)
                                if (tab.id && !tab.closed) {

                                    obj = {
                                        tab_id: tab.id,
                                        rating: parseFloat(rating)
                                    }
                                }

                                // obj[tab.id] = rating

                                tabs_array.push(obj)

                            })
                            tabs_array.sort((item1, item2) => (item1.rating < item2.rating) ? 1 : (item1.rating > item2.rating) ? -1 : 0)
                            tabs_array.reverse();

                            const tabs_to_remove = tabs_array.slice(0, difference);
                            
                            tabs_to_remove.forEach(item=> {

                                if (!item.classification) {
                                    item.classification = 'misc'
                                }
                               
                                closeTab(item.tab_id, item.classification)
                            })

                        }
                    }
                });
            }, 180000)




            // remove the smallest tab




        })
    }

    // actually, let's try to get all tabs;
}


chrome.tabs.onCreated.addListener(async (tab, changeInfo) => {
    if (SESSION.id) {
        if (SESSION.previous_tab_id) {
            endTimeSpent(SESSION.previous_tab_id)
            stopTotalDistractionTimeCounter(SESSION.previous_tab_id)
        }
        SESSION.previous_tab_id = tab.id;

        if (!DISTANCE_SCROLLED[SESSION.previous_tab_id]) {
            DISTANCE_SCROLLED[SESSION.previous_tab_id] = {
                cumulative: 0,
                value: 0
            }


        }
        if (!CLICKS[SESSION.previous_tab_id]) {
            CLICKS[SESSION.previous_tab_id] = 0;
        }

        registerTab(tab);
        initializeTimeSpent(tab)


    }



});
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

function showTaskReminder() {
    try {

        const div = document.createElement('div');
        div.classList.add("distraction-watch");

        document.body.prepend(div);

        div.innerHTML += `<div class="distraction-timer">
        <div class="distraction-timer-container">

            <div class="distraction-timer-header">
                    <svg width="14" height="14" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <div class="title">Distraction Timer</div>
                    <svg style="cursor:pointer" id="close-distraction-watch" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.575 7.975L1.675 12.875C1.49167 13.0583 1.25833 13.15 0.975 13.15C0.691667 13.15 0.458333 13.0583 0.275 12.875C0.0916663 12.6917 0 12.4583 0 12.175C0 11.8917 0.0916663 11.6583 0.275 11.475L5.175 6.575L0.275 1.675C0.0916663 1.49167 0 1.25833 0 0.975C0 0.691667 0.0916663 0.458333 0.275 0.275C0.458333 0.0916663 0.691667 0 0.975 0C1.25833 0 1.49167 0.0916663 1.675 0.275L6.575 5.175L11.475 0.275C11.6583 0.0916663 11.8917 0 12.175 0C12.4583 0 12.6917 0.0916663 12.875 0.275C13.0583 0.458333 13.15 0.691667 13.15 0.975C13.15 1.25833 13.0583 1.49167 12.875 1.675L7.975 6.575L12.875 11.475C13.0583 11.6583 13.15 11.8917 13.15 12.175C13.15 12.4583 13.0583 12.6917 12.875 12.875C12.6917 13.0583 12.4583 13.15 12.175 13.15C11.8917 13.15 11.6583 13.0583 11.475 12.875L6.575 7.975Z" fill="white"/>
                    </svg>
                    
                    
            
            </div>

            <div id="distraction-timer-time" class="distraction-timer-time">
            </div>
        </div>
    </div>`
       
        
        setInterval(() => {
            chrome.runtime.sendMessage({message: 'get-total-distraction-time'}, (response) => {

                const timer_el = document.getElementById("distraction-timer-time");
                const seconds = response;

                if (seconds < 60) {
                    
                    timer_el.innerText = `${seconds} seconds`;
                }

                else {
                    const minutes = parseInt(seconds/60)
                    if (minutes === 1) timer_el.innerText  = `${minutes} min`
                    else timer_el.innerText  = `${minutes} mins`

                }
            });

       }, 1000)



        document.getElementById('close-distraction-watch').addEventListener('click', function() {

            console.log('close-distraction-watch')
            div.style.display = 'none';

        })

    } catch (e) {
        throw e;
    }

}

function showDistractionWatch(timer, tab_id) {
    try {

        const div = document.createElement('div');
        div.classList.add("distraction-watch");

        document.body.prepend(div);

        div.innerHTML += `<div class="distraction-timer">
        <div class="distraction-timer-container">

            <div class="distraction-timer-header">
                    <svg width="14" height="14" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <div class="title">Distraction Timer</div>
                    <svg style="cursor:pointer" id="close-distraction-watch" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.575 7.975L1.675 12.875C1.49167 13.0583 1.25833 13.15 0.975 13.15C0.691667 13.15 0.458333 13.0583 0.275 12.875C0.0916663 12.6917 0 12.4583 0 12.175C0 11.8917 0.0916663 11.6583 0.275 11.475L5.175 6.575L0.275 1.675C0.0916663 1.49167 0 1.25833 0 0.975C0 0.691667 0.0916663 0.458333 0.275 0.275C0.458333 0.0916663 0.691667 0 0.975 0C1.25833 0 1.49167 0.0916663 1.675 0.275L6.575 5.175L11.475 0.275C11.6583 0.0916663 11.8917 0 12.175 0C12.4583 0 12.6917 0.0916663 12.875 0.275C13.0583 0.458333 13.15 0.691667 13.15 0.975C13.15 1.25833 13.0583 1.49167 12.875 1.675L7.975 6.575L12.875 11.475C13.0583 11.6583 13.15 11.8917 13.15 12.175C13.15 12.4583 13.0583 12.6917 12.875 12.875C12.6917 13.0583 12.4583 13.15 12.175 13.15C11.8917 13.15 11.6583 13.0583 11.475 12.875L6.575 7.975Z" fill="white"/>
                    </svg>
                    
                    
            
            </div>

            <div id="distraction-timer-time" class="distraction-timer-time">
            </div>
        </div>
    </div>`
       
        
        setInterval(() => {
            chrome.runtime.sendMessage({message: 'get-total-distraction-time'}, (response) => {

                const timer_el = document.getElementById("distraction-timer-time");
                const seconds = response;

                if (seconds < 60) {
                    
                    timer_el.innerText = `${seconds} seconds`;
                }

                else {
                    const minutes = parseInt(seconds/60)
                    if (minutes === 1) timer_el.innerText  = `${minutes} min`
                    else timer_el.innerText  = `${minutes} mins`

                }
            });

       }, 1000)



        document.getElementById('close-distraction-watch').addEventListener('click', function() {

            console.log('close-distraction-watch')
            div.style.display = 'none';

        })

    } catch (e) {
        throw e;
    }

}


function showLocked() {
    const modal_div = document.createElement('div');
    modal_div.style.height = '100%';
    modal_div.style.width = '100%';
    modal_div.style.position = 'fixed';
    modal_div.style['zIndex'] = 10000000000000000;
    modal_div.innerHTML = `
        <div class="hardlock-modal" style="background-color:#222436; position: fixed; top: 0; left: 0; height: 100%; width:100% ">
            <div class="hardlock-modal__container" style="height: 50vh !important;  margin: auto !important;">
                <div class="logo" style="width: 50% !important; margin: auto !important; display: flex !important; align-items: center; text-align: center; margin: 120px auto !important; justify-content: center;">
                    <svg style="margin-right: 8px !important;" width="20" height="20" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <p style="color: white !important; font-size: 20px !important; font-family: 'Inter', sans-serif !important;">FocusTug</p>
                </div>
                <div class="hardlock-modal-message">
                    <h1 style="color: white !important; text-align:center; font-size: 20px !important; font-weight: 400; line-height: 1.5 !important; font-family: 'Inter', sans-serif !important;  margin: auto;">You've locked this site permanently during your work session.</h1>
                    <p style="color: white !important; font-family: 'Inter', sans-serif !important; font-size: 16px; font-weight: 400; text-align: center;">Complete your task and turn off FocusTug to access this site.</p>
                </div>
            </div>

        </div>
    `

    document.body.prepend(modal_div)
    
}


function showBlocker(host, tab) {




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
        message_tone = settings && settings.settings && settings.settings["TONE"] || 'normal'

        let message = ''
    
        try {
            message = randomBlockerMessage(message_tone)
        } catch (e) {
    
        }
    
        modal_div.innerHTML += `
        <div class="blocker-modal" style="background-color:#222436; position: fixed; top: 0; left: 0; height: 100%; width:100% ">
            <div class="hardlock-modal__container" style="height: 50vh !important;  margin: auto !important;">
                <div class="logo" style="width: 50% !important; margin: auto !important; display: flex !important; align-items: center !important; text-align: center; margin: 120px auto !important; justify-content: center !important;">
                    <svg style="margin-right: 8px !important;" width="20" height="20" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <p style="color: white !important; font-size: 20px !important; font-family: 'Inter', sans-serif !important;">FocusTug</p>
                </div>
                <div class="hardlock-modal-message">
                    <h1 style="color: white !important; text-align:center; font-size: 20px !important; font-weight: 400; line-height: 1.5 !important; font-family: 'Inter', sans-serif !important;  margin: auto;">${message}</h1>
                </div>

                <div class="focustug__bottom" style="width: 80%; margin:auto; margin-top: 120px; display: flex; justify-content: center">
                    <button id="blocker-close-cta" style="color: #4ECB71; font-size: 18px; margin-right: 16px; background-color: transparent; border: none; display: flex; align-items: center;">
                        <svg style="margin-right: 8px;" width="18" height="18" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M33.8338 25.6606L49.2525 10.2419C50.8374 8.65704 50.8374 6.0875 49.2525 4.50261L46.5992 1.84931C45.0143 0.264424 42.4448 0.264424 40.8599 1.84931L25.4412 17.268L10.0224 1.84931C8.43756 0.264424 5.86801 0.264424 4.28313 1.84931L1.62982 4.50261C0.0449416 6.0875 0.0449416 8.65704 1.62982 10.2419L17.0485 25.6606L1.62982 41.0794C0.0449416 42.6642 0.0449416 45.2338 1.62982 46.8187L4.28313 49.472C5.86801 51.0569 8.43756 51.0569 10.0224 49.472L25.4412 34.0533L40.8599 49.472C42.4448 51.0569 45.0143 51.0569 46.5992 49.472L49.2525 46.8187C50.8374 45.2338 50.8374 42.6642 49.2525 41.0794L33.8338 25.6606Z" fill="#4ECB71"/>
                        </svg>
                            
                        Close tab
                    </button>
                    <button id="ignore-once"  style="color: red; font-size: 18px; margin-right: 16px; background-color: transparent; border: none; display: flex; align-items: center;">
                        <svg style="margin-right: 8px;" width="18" height="18" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M33.8338 25.6606L49.2525 10.2419C50.8374 8.65704 50.8374 6.0875 49.2525 4.50261L46.5992 1.84931C45.0143 0.264424 42.4448 0.264424 40.8599 1.84931L25.4412 17.268L10.0224 1.84931C8.43756 0.264424 5.86801 0.264424 4.28313 1.84931L1.62982 4.50261C0.0449416 6.0875 0.0449416 8.65704 1.62982 10.2419L17.0485 25.6606L1.62982 41.0794C0.0449416 42.6642 0.0449416 45.2338 1.62982 46.8187L4.28313 49.472C5.86801 51.0569 8.43756 51.0569 10.0224 49.472L25.4412 34.0533L40.8599 49.472C42.4448 51.0569 45.0143 51.0569 46.5992 49.472L49.2525 46.8187C50.8374 45.2338 50.8374 42.6642 49.2525 41.0794L33.8338 25.6606Z" fill="red"/>
                        </svg>
                            
                        Ignore once
                    </button>
                    <button id="whitelist" style="color: white; font-size: 18px; margin-right: 16px; background-color: transparent; border: none; display: flex; align-items: center;">
                        <svg style="margin-right: 8px;" width="18" height="18" viewBox="0 0 134 99" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M46.8944 75.8647L122.302 0.457031L133.776 11.9309L46.8944 98.8124L0.585205 52.5031L12.059 41.0293L46.8944 75.8647Z" fill="white"/>
                        </svg>
                            
                            
                        Whitelist
                    </button>
                    
                </div>
            </div>

        </div>
        `
        // set timer for seconds
        let initial_seconds = 5;
        let interval = null;
        try {
            interval = setInterval(() => {
    
                initial_seconds--;
    
    
                if (initial_seconds > 0) {
    
                    const timer_el = document.getElementById("blocker-close-message");
    
                    if (timer_el) {
                        timer_el.innerText = `Closing in ${initial_seconds} seconds...`
                    }
                } else {
    
                    clearInterval(interval)
                    interval = null
                    chrome.runtime.sendMessage({
                        message: 'close-tab',
                        data: {
                            tab_id: tab
                        }
                    })
                }
    
            }, 1000)
    
    
        } catch (e) {
    
        }
    
        // create close button listener
        document.getElementById("blocker-close-cta")?.addEventListener('click', () => {
            clearInterval(interval)
            // alert('something')
            //modal_div.style.display = 'none'
            chrome.runtime.sendMessage({
                message: 'close-tab',
                data: {
                    tab_id: tab
                }
            })
        });
    
        document.getElementById('ignore-once')?.addEventListener('click', () => {
            clearInterval(interval)
    
    
            //DISTRACTIONS_COUNTER++
           
            console.log("trying to shut down")
    
            modal_div.style.display = "none"
    
            //console.log(modal_div)
    
            chrome.runtime.sendMessage({
                message: 'ignore-once',
                data: {
                    tab_id: tab
                },
            });
            chrome.runtime.sendMessage({
                message: 'start-distraction-timer',
                data: {
                    tab_id: tab
                }
            })
    
    
    
    
        })
    
        document.getElementById('whitelist')?.addEventListener('click', () => {
    
            clearInterval(interval)
            chrome.runtime.sendMessage({
                message: 'clear-interval',
                data: {
                    name: 'total_distraction_time'
                }
            })
            chrome.runtime.sendMessage({
                message: 'whitelist-host',
                data: {
                    host: host
                }
            });
            modal_div.style.display = "none"
        })
    })

}

function showMaybeBlocker(host, tab, SESSION) {




    // an idiot</div>`;

    // check if modal already exists
    const maybeModal =  document.getElementsByClassName('maybe-modal');
    if (maybeModal.length > 0 &&maybeModal[0] && maybeModal[0].style.display === 'block') {
        return;
    }

    const modal_div = document.createElement('div');
    modal_div.classList.add('maybe-modal');
    modal_div.style.height = 'fit-content';
    modal_div.style.width = '50%';
    modal_div.style.marginTop = '10vh';
    modal_div.style.marginLeft = '25%';
    modal_div.style.boxShadow = 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px';
    modal_div.style.position = 'fixed';




    document.body.prepend(modal_div)

    let message_tone = 'normal'

    chrome.storage.sync.get(null, (settings) => {
        message_tone = settings && settings.settings && settings.settings["TONE"] || 'normal'

        let message = ''
    
        try {
            message = randomBlockerMessage(message_tone)
        } catch (e) {
    
        }
    
        modal_div.innerHTML += `
        <div class="blocker-modal-container">
            <div class="blocker-modal-logo" style="display: flex !important; align-items: center; !important">
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
                    Is this important to your task?
    
                </div>
    
                <div id="blocker-close-message" class="blocker-closer-message" style="margin-bottom: 24px; color: white !important">
                    ${SESSION.name}
                </div>
    
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 64px; width: 60%; margin: auto; margin-top: 16px;;">
                
                
                <div style="display: flex; margin-top: 36px; flex-direction: column">
                        <button id="yes" style=" min-width: 300px;  font-size: 16px !important; margin-bottom: 24px;  
                            border: 2px solid #4ECB71; color: black !important; 
                            padding: 16px;
                            border-radius: 5px;
                            background-color: #4ECB71 !important" class="blocker-close-cta"> Yes</button>
                        <button id="no" style="  min-width: 300px; font-size: 16px !important;
                            margin-bottom: 24px; border: 2px solid #A90F3D; color: white;  
                            border-radius: 5px;
                            background: #A90F3D !important;  padding:16px;; border-radius:5px;" class="blocker-close-cta">No</button>
                       
                    </div>
                </div>
    
            </div>
    
    
    
            <div class="blocker-bottom" style="background: #222436; !important"> 
                    <!--<button>Ignore once</button>--->
            </div>
        </div>`
        // set timer for seconds
        let initial_seconds = 4;
        let interval = null;
        
    
        // create close button listener
        document.getElementById("yes")?.addEventListener('click', () => {
            // alert('something')
            modal_div.style.display = 'none';
            chrome.runtime.sendMessage({
                message: 'whitelist-host',
                data: {
                    host: host
                }
            });
            
        });
    
        document.getElementById('no')?.addEventListener('click', () => {
    

            chrome.runtime.sendMessage({
                message: 'close-tab',
                data: {
                    tab_id: tab
                }
            })
        
    
    
    
        })
    
        
    })

}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message === "clear-interval") {
        if (message.data.name === 'total_distraction_time') {}
    }
    if (message.message === 'get-total-distraction-time') {

        sendResponse(GLOBALS.total_distraction_time)
        
        chrome.runtime.sendMessage({
            message: 'total-distraction-time',
            data: {
                time: GLOBALS.total_distraction_time
            }
        })
    }
    if (message.message === 'weekly-stats') {
        sendResponse(WEEK_STATS)
    }
})

function onTabActivated(tab) {
    console.log('tab activated')
    /*chrome.scripting.executeScript({
        target: {
            tabId: tab.id || tab.tabId
        },
        files: ["events.js"],
        //func: showBlocker,
        //rgs: [host, tabId]

    })
    .then((e) => {
        console.log('attached to active')

    }).catch(e => {


    })*/


    const tab_id = tab.id || tab.tabId;
    if (SESSION.id) {
        if (SESSION.previous_tab_id) {
            endTimeSpent(SESSION.previous_tab_id)
            stopTotalDistractionTimeCounter(SESSION.previous_tab_id)
        }
        SESSION.previous_tab_id = tab_id,
            registerTab(tab);
        initializeTimeSpent(tab);
        computeReopenedTimes(tab);

        if (!DISTANCE_SCROLLED[tab_id]) {

            DISTANCE_SCROLLED[tab_id] = {
                cumulative: 0,
                value: 0
            }

        }
        if (!CLICKS[tab_id]) {
            CLICKS[tab_id] = 0;
        }

    }
}

function computeTimeDecay(tab) {
    
    if (tab) {

        //Relevance = 1 / ((Current Time - Last Reopen Time) + (Current Time - Creation Time))

        let current_time = new Date().getTime();

        const result = 1 / ((current_time - tab.last_opened) + (current_time - tab.created));
        // get th
        console.log('time decay is ' + result)
        return result
    }
    
}




    chrome.tabs.onActivated.addListener(async (tab, changeInfo, ) => {
        console.log('tab on Activated')
        console.log(Object.keys(tab))
        
        
        
        const tab_details = chrome.tabs.get(parseInt(tab.tabId), (focused_tab) => {
           
            onTabActivated(focused_tab)
            const relevance = computePageRelevance(tab);
    
            chrome.tabs.get(parseInt(tab.tabId), (t) => {
                tab = t
                let host = new URL(tab.url).hostname;
                let splitt = host.split('www.');
                if (splitt && splitt.length > 1) {
                    host = splitt[1]
                }
    
                const relevant_host = Object.keys(TASKS[SESSION.id].visited_hosts).find(item => item.indexOf(host) > -1);
                if (relevant_host && TASKS[SESSION.id].visited_hosts[relevant_host].verdict === 'distraction') {
                    initializeTotalDistractionTimeCounter(SESSION.previous_tab_id)
    
                }
                let relevant_url = Object.keys(TASKS[SESSION.id].visited_urls).find(item => item.indexOf(tab.url) > -1);
    
    
                if (relevant_url && TASKS[SESSION.id].visited_urls[relevant_url].verdict === 'ignore-once') {
                    initializeTotalDistractionTimeCounter(SESSION.previous_tab_id)
                }
            })
        })





    });



    chrome.tabs.onRemoved.addListener(async (tabId) => {
        try {


            clearInterval(tabId)
            onRemoveTab(tabId)

        } catch (e) {

        }
    })




    function computeReopenedTimes(tab) {
        return;
        const tab_id = tab.id || tab.tabId;
        let index = TASKS[SESSION.id].tabs.findIndex(t => t.id === tab_id)
        if (tab) {

            const new_details = {
                ...tab,
                reopened_times: tab.reopened_times++,
                last_opened: new Date().getTime()
            }
            TASKS[SESSION.id].tabs[index] = new_details

        }

    }




    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

        if (message.message === 'find-active-session') {
            chrome.runtime.sendMessage({
                "message": 'activeSession',
                session: SESSION
            });

            sendResponse(SESSION)
        }
        if (message.message === 'start-distraction-timer') {
            initializeTotalDistractionTimeCounter(message.data.tab_id)
        }
        if (message.message === 'get-closed-tabs') {
            if (TASKS[SESSION.id]) {

                const closed_tabs = TASKS[SESSION.id].tabs.filter(tab => tab.closed);
                chrome.runtime.sendMessage({
                    message: 'closedTabs',
                    data: closed_tabs
                })
            }
        }

        if (message.message == 'ignore-once') {
            try {
                increaseDayStats('distractions_ignored', 1)

                const tab_id = message.data.tab_id;
                chrome.tabs.get(parseInt(tab_id), (t) => {
                    let tab = t;
                    if (tab) {
                        const focused_tab = TASKS[SESSION.id].tabs.find(ta => parseInt(ta.id) === tab.id);
                        focused_tab.classification = 'distraction'
                        TASKS[SESSION.id].visited_urls[tab.url] = {
                            verdict: 'ignore-once'
                        }



                        chrome.scripting.executeScript({
                            target: {
                                tabId: parseInt(tab_id)
                            },
                            //files : [ "parn.js"],
                            func: showDistractionWatch,
                            args: [GLOBALS.total_distraction_time, parseInt(tab_id)]

                        }).then((e) => {
                            console.log('distraction watch')

                           
                        
                            chrome.runtime.onMessage.addListener((message) => {
                                if (message.message === 'total-distraction-time') {
                                    console.log('got distraction time')
                                    console.log('got distraction time in ')
                                }
                            })
                        }).catch(e => {
                            throw e
                        })


                    }

                })
            } catch (e) {
                throw e
            }
        }
        if (message.message == 'whitelist-host') {
            const host = message.data.host;

            TASKS[SESSION.id].visited_hosts[host].verdict = 'whitelisted';

        }
        if (message.message == 'close-session') {
            // first package it in the list of tasks
            SESSION.DISTRACTIONS = DISTRACTIONS_COUNTER;
            SESSION.DISTRACTIONS_CLOSED = DISTRACTIONS_CLOSED
            SESSION.TOTAL_TASK_TIME = GLOBALS.total_task_time
            SESSION.TOTAL_DISTRACTION_TIME = GLOBALS.total_distraction_time;
            SESSION.break_time = {}
            GLOBALS.run_initial_removal = false;
            clearInterval(GLOBALS.remove_excess_tabs_interval);
            clearInterval(INTERVALS['total_distraction_time_for_' + SESSION.previous_tab_id])
            
            chrome.action.setBadgeBackgroundColor({color: "red"})
            chrome.action.setBadgeText({text: "I"})

            GLOBALS.previous_tab_id = null


            TASKS[SESSION.id] = {
                ...TASKS[SESSION.id],
                ended_at: new Date().getTime(),
                meta: {
                    ID: SESSION.id,
                    SUMMARY: SESSION.summary,
                    NAME: SESSION.name,
                    DISTRACTIONS: DISTRACTIONS_COUNTER,
                    DISTRACTIONS_CLOSED: DISTRACTIONS_CLOSED,
                    TOTAL_TASK_TIME: GLOBALS.total_task_time,
                    TOTAL_DISTRACTION_TIME: GLOBALS.total_distraction_time,
                    TASKS_CLOSED: GLOBALS.TASKS_CLOSED,
                    TASK_TABS: TASKS[SESSION.id].tabs.filter(t => t.classification === 'task').length
                },
            }



            chrome.storage.sync.get(null, async (setting) => {
                if (setting && setting.auth && setting.auth.USER_TOKEN) {
                    const TOKEN = setting.auth.USER_TOKEN;



                    // send to server
                    await sendRequest('http:https://leapstartlabapi.herokuapp.com/api/v1/sessions/register', "POST", {
                        summary: SESSION.summary,
                        id: SESSION.id,
                        created: TASKS[SESSION.id].created,
                        ended_at: new Date().getTime(),
                        tabs: TASKS[SESSION.id].tabs,
                        meta: TASKS[SESSION.id].meta,
                    }, {
                        "Authorization": `BEARER ${TOKEN}`
                    })


                    //  reset session
                    SESSION = {
                        id: '',
                        previous_tab_id: null,
                        data: '',
                        token: '',
                    }




                    // clear the timer 
                    clearInterval(GLOBALS.total_task_time_interval);
                    clearInterval(GLOBALS.break_due_interval);
                    clearInterval(GLOBALS.break_time_interval);
                    clearInterval(GLOBALS.total_distraction_time_interval)




                    SESSION.id = null
                    Object.keys(GLOBALS).forEach(key => {

                        if (key === 'intervals') {
                            GLOBALS[key] = {}
                        } else {
                            GLOBALS[key] = null
                        }
                    })

                    GLOBALS.total_task_time = 0;
                    GLOBALS.total_distraction_time = 0;

                    INTERVALS = {}

                    TIME_SPENT = {}
                    DISTANCE_SCROLLED = {}
                    CLICKS = {}

                    TASKS_CLOSED = 0

                    DISTRACTIONS_COUNTER = 0
                    DISTRACTIONS_CLOSED = 0;
                    DISTRACTIONS_IGNORED = 0;

                    BREAK_TIME_LEFT = 0;
                    BREAK_TIME_ONGOING = false;
                    BREAK_TIME_DUE = false;


                    clearInterval(GLOBALS.total_task_time_interval)
                }
            })
            // send to server




        }
        if (message.message == 'restore-tab') {
            // id  
            try {
                console.log('restore tab')
                const id = parseInt(message.data.id);

                console.log("id is " + id)

                const tab = TASKS[SESSION.id].tabs.find(t => t.id === id);
                const index = TASKS[SESSION.id].tabs.indexOf(tab);
                console.log('index of tab ' + index)

                TASKS[SESSION.id].tabs.splice(index, 1);
            } catch (e) {
                throw e
            }
        }
    });




    async function computePageRelevance(tab, description = null) {

        if (TASKS[SESSION.id] && !BREAK_TIME_ONGOING) {

            const tabId = tab.id;
            let is_distraction = null;
    
            // see if it's  a locked site 
    
            chrome.storage.sync.get(null, async (settings) => {
                try {
                    // see if something is part of the locked sites
                    let host = new URL(tab.url).hostname;
                    if (settings.LOCKED_SITES && settings.LOCKED_SITES.length > 0) {
                        for (site of settings.LOCKED_SITES) {
                            if (host.indexOf(site) > -1) {
                                chrome.scripting
                                    .executeScript({
                                        target: {
                                            tabId: tab.id
                                        },
                                        //files : [ "blocker.js"],
                                        func: showLocked,
                                        //args: [host, tabId]
            
                                    })
                                    .then((e) => {
            
                                    }).catch(e => {
            
                                    });
                                console.log("found locked _site " + host)
                                return false
                            }
                        }
                    }
                }catch(e) {
    
                }
                
                if (TASKS[SESSION.id] && !BREAK_TIME_ONGOING) {
                    if (tab.url) {
                        let host = new URL(tab.url).hostname;
                        let splitt = host.split('www.');
                        if (splitt && splitt.length > 1) {
                            host = splitt[1]
                        }
        
                        if (!TASKS[SESSION.id].visited_hosts[host]) TASKS[SESSION.id].visited_hosts[host] = {
                            verdict: "",
                            relevance: null
                        }
                        else if (TASKS[SESSION.id].visited_hosts[host].verdict === 'distraction') {
                            //is_distraction = true;
        
        
                            increaseDayStats('distractions_detected', 1)
        
                            chrome.scripting
                                .executeScript({
                                    target: {
                                        tabId: tab.id
                                    },
                                    //files : [ "blocker.js"],
                                    func: showBlocker,
                                    args: [host, tabId]
        
                                })
                                .then((e) => {
        
                                }).catch(e => {
        
                                });
        
                            const focused_tab = TASKS[SESSION.id].tabs.find(ta => parseInt(ta.id) === tab.id);
                            if (focused_tab) {
                                focused_tab.classification = 'distraction'
                            }
        
                            is_distraction = true;
        
                            //initializeTotalDistractionTimeCounter(tab.id)
        
                            return false;
                        } else if (TASKS[SESSION.id].visited_hosts[host].verdict === 'whitelisted') {
        
                            // do nothing
                            return
                        } else if (Object.keys(TASKS[SESSION.id].visited_hosts).find(item => item.indexOf(host) > -1)) {
                            let corresponding_host = Object.keys(TASKS[SESSION.id].visited_hosts).find(item => item.indexOf(host) > -1)
                            corresponding_host = TASKS[SESSION.id].visited_hosts[host];
        
                            if (corresponding_host.verdict === 'whitelisted') {
                                return;
                            }
                        } else {
                            const focused_tab = TASKS[SESSION.id].tabs.find(ta => parseInt(ta.id) === tab.id);
                            if (focused_tab)
                                focused_tab.classification = 'task';
        
                        }
        
        
        
                        if (!TASKS[SESSION.id].visited_urls[tab.url]) TASKS[SESSION.id].visited_urls[tab.url] = {
                            verdict: "",
                            relevance: null
                        }
                        else if (TASKS[SESSION.id].visited_urls[tab.url].verdict === 'distraction') {
                            increaseDayStats('distractions_detected', 1)
        
                            chrome.scripting
                                .executeScript({
                                    target: {
                                        tabId: tab.id
                                    },
                                    //files : [ "blocker.js"],
                                    func: showBlocker,
                                    args: [host, tabId]
        
                                })
                                .then((e) => {
        
                                }).catch(e => {
        
                                })
        
                            focused_tab = TASKS[SESSION.id].tabs.find(ta => parseInt(ta.id) === tab.id);
                            if (focused_tab) focused_tab.classification = 'distraction'
                            is_distraction = true;
        
                            //initializeTotalDistractionTimeCounter(tab.id)
        
        
                            return false
                        } else if (TASKS[SESSION.id].visited_urls[tab.url].verdict === 'ignore-once') {
                            increaseDayStats('distractions_detected', 1)
        
                            chrome.scripting
                                .executeScript({
                                    target: {
                                        tabId: tab.id
                                    },
                                    //files : [ "blocker.js"],
                                    func: showBlocker,
                                    args: [host, tabId]
        
                                })
                                .then((e) => {
        
                                }).catch(e => {
        
                                })
                            return false;
                        } else {
                            const focused_tab = TASKS[SESSION.id].tabs.find(ta => parseInt(ta.id) === tab.id);
                            if (focused_tab) focused_tab.classification = 'task'
        
                        }
        
                        // rate relevance
                        try {
                            const query = {
                                summary: TASKS[SESSION.id].summary,
                                title: tab.title,
                                
                            }
                            if (tab.url) {
                                try {
                                    query.host = new URL(tab.url).hostname
                                }catch(e) {
        
                                }
                            }
                            if (description) {
                                query.description = description
                            }
        
                            const result = await sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/sessions/rel', "POST", query, {
                                "Authorization": "Bearer " + USER_TOKEN
                            }).then(resp=>{
                                if (resp && resp.data && resp.status === false && resp.data.indexOf('renewed') > -1) {
                                    PLAN_EXPIRED = true
                                    chrome.action.setBadgeText({text: "E"})
                                    chrome.action.setBadgeBackgroundColor({color: "red"})
                                    chrome.runtime.sendMessage({message: 'plan-expired'});
                                }
        
        
                                const relevance = resp.data && parseInt(resp.data);
                                console.log('relevance')
                                console.log(relevance)
            
                                if (relevance && parseInt(relevance) === 5 ) {
                                    chrome.scripting
                                    .executeScript({
                                        target: {
                                            tabId: tab.id
                                        },
                                        //files : [ "blocker.js"],
                                        func: showMaybeBlocker,
                                        args: [host, tabId, SESSION]
            
                                    })
                                    .then((e) => {
            
                                    }).catch(e => {
            
                                    })
                                }
            
                                else if (relevance && parseInt(relevance) < 5) {
                                    TASKS[SESSION.id].visited_urls[tab.url].verdict = 'distraction';
                                    TASKS[SESSION.id].visited_urls[tab.url].relevance = relevance
                                    
                                    increaseDayStats('distractions_detected', 1)
            
            
                                   
            
                                    const focused_tab = TASKS[SESSION.id].tabs.find(t => parseInt(t.id) === tab.id);
                                    if (focused_tab) focused_tab.classification = 'distraction'
            
                                    is_distraction = true;
                                    chrome.scripting
                                    .executeScript({
                                        target: {
                                            tabId: tab.id
                                        },
                                        //files : [ "blocker.js"],
                                        func: showBlocker,
                                        args: [host, tabId]
            
                                    })
                                    .then((e) => {
            
                                    }).catch(e => {
            
                                    })
            
            
                                    return false;
                                } else {
                                    // set to task 
                                    TASKS[SESSION.id].visited_urls[tab.url].verdict = 'task';
                                    TASKS[SESSION.id].visited_urls[tab.url].relevance = relevance
            
                                    const focused_tab = TASKS[SESSION.id].tabs.find(t => t.id === tab.id);
                                    if (focused_tab) focused_tab.classification = 'task'
            
            
            
                                }
                            })
                            
        
        
                            // if the function hasn't returned yet here, then it means that the tab in focus is not a distraction
                            // thus, clear the interval
        
                        } catch (e) {
                            throw e
                        }
        
                    }
                }
            })
        }


    }

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        let is_distraction = false;

        // clear distraction time, if available
        if (message.message == 'compute-page-relevance') {
            const tabId = sender.tab.id;
            const tab = sender.tab;

            computePageRelevance(tab, message.data.description)

        }
    })



    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (SESSION.id) {
            // update full url 

           const focused_tab =  TASKS[SESSION.id].tabs.find(t => parseInt(t.id) === parseInt(tabId));

           if (focused_tab) {
            focused_tab.full_url = tab.url
           }
        }
    })



    async function closeTab(tab, type = null,) {
        try {

            if (type === 'distraction') {
                DISTRACTIONS_COUNTER++
                increaseDayStats('distractions_closed', 1)
            }



            let tab_id;
            if (typeof(tab) === 'object') {
                tab_id = tab.id || tab.tabId
            } else {
                tab_id = tab;
                // tab = 
                if (TASKS[SESSION.id]) {

                    chrome.tabs.get(parseInt(tab_id), (t) => {
                        if (type === 'distraction') {
                            DISTRACTIONS_CLOSED++
                        } else if (type === 'task') {
                            TASKS_CLOSED++
                        }

                        tab_id = parseInt(tab_id)
                        tab = t;

                        try {

                            chrome.tabs.remove(parseInt(tab_id));

                            //const tab = TASKS[SESSION.id].tabs.find(t=> parseInt(t.id) === parseInt(tab_id))
                            for (let i = 0; i < TASKS[SESSION.id].tabs.length; i++) {

                                let focused_tab = TASKS[SESSION.id].tabs[i];
                                if (focused_tab.id === tab_id) {


                                    try {

                                        if (tab.title && tab.url) {

                                            TASKS[SESSION.id].tabs[i] = {
                                                ...focused_tab,
                                               // classification: distraction ? 'distraction' : 'task',
                                                favIconUrl: tab.favIconUrl,
                                                title: tab.title,
                                                url: new URL(tab.url).hostname,
                                                closed: true,
                                                full_url: tab.url,
                                            };

                                        }

                                        // get all close tabs

                                        let closed = TASKS[SESSION.id].tabs.filter(t => t.closed === true).length;
                                        if (closed > '999') {
                                            closed = '999+'
                                        }
                                        chrome.action.setBadgeText({text: closed.toString()})
                                        chrome.action.setBadgeBackgroundColor({color: "teal"})

                                    } catch (e) {
                                        throw e
                                    }
                                }




                            }
                            //throw e
                        } catch (e) {
                            throw e
                        }

                    })
                }
            }



        } catch (e) {}

    }

