//const FREE_PASS = ["chrome://", "google.com"]
const VERSION = "0.1";
let NEW_VERSION = "0.1"



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

    check_latest_version_interval: null
}


let DISTRACTIONS_COUNTER = 0;
let TASKS_CLOSED = 0;
let DISTRACTIONS_CLOSED = 0;
let DISTRACTIONS_IGNORED = 0;

let BREAK_TIME_DUE = false;
let BREAK_TIME_ONGOING = false;
let BREAK_TIME_LEFT = 0;




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



let DISTANCE_SCROLLED = {

}
let CLICKS = {

}

let SESSION = {
    id: '',
    previous_tab_id: null,
    data: '',
}




chrome.runtime.onInstalled.addListener(function(details) {
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

async function getLatestVersion() {
    return await sendRequest("http:https://leapstartlabapi.herokuapp.com/api/v1/updates/version", "GET")
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
            }, 10000) // frequency_in_milliseconds)
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

                        <img style="width: 100%; height: 100%; object-fit: contain" src="./images/celebrate.png" alt="">
                    </div>
                    <div  id="blocker-close-message" class="blocker-header-message">
                        It's break time!!!

                    </div>

                    <div id="blocker-close-message" class="blocker-closer-message" style="margin-bottom: 24px;">
                        Closing in 10 seconds...
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 64px; width: 60%; margin: auto; margin-top: 16px;;">
                        <div>
                            <button id="blocker-close-cta" style="margin-bottom: 24px; margin-right: 16px; border: 2px solid #4ECB71; color: #4ECB71" class="blocker-close-cta"> Close now</button>

                        </div>

                        <div>
                            <button id="suspend" style="margin-bottom: 24px; margin-right: 16px; border: 2px solid lightgrey; color: lightgray" class="blocker-close-cta"> Suspend to break time</button>
                            <button id="whitelist" style="margin-bottom: 24px; margin-right: 16px; border: 2px solid lightgrey; color: lightgray" class="blocker-close-cta"> Whitelist www.google.com for this session</button>
                            <button id="ignore-once" style="margin-bottom: 24px; border: 2px solid lightgrey; color: lightgray" class="blocker-close-cta">Ignore once</button>
                        </div>
                    </div>

                </div>



                <div class="blocker-bottom"> 
                        <!--<button>Ignore once</button>--->
                </div>
            </div>
        </div>
        `
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
    if (message.message === 'create-active-session') {
        // split to get the message id

        const time = new Date().getTime();
        const message_id = message.task_id
        const task_name = message.task
        //chrome.storage.local.set({'activeSession': message_id})
        SESSION.id = message_id
        SESSION.summary = message.summary
        SESSION.name = message.task_name
        SESSION.break_time = message.break_time
        SESSION.created = time

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


            chrome.scripting.executeScript({
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


                })
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

        closeTab(message.data.tab_id, true)

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
    } else if (message.message === 'popup') {
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
        INTERVALS['total_distraction_time_for_' + tabId] = setInterval(() => {
            GLOBALS.total_distraction_time++;
            chrome.runtime.sendMessage({
                message: 'total-distraction-time',
                data: {
                    time: GLOBALS.total_distraction_time
                }
            })

        }, 1000)

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

                TIME_SPENT[tab_id] += 10


            }, 10000)
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
            setInterval(async () => {

                let tabs_no = 0
                await chrome.tabs.query({}, (tabs) => {
                    tabs_no = tabs.length

                    if (tabs_no > OPTIMAL_TABS) {
                        // count for the differnce
                        const difference = tabs_no - OPTIMAL_TABS;


                        // if
                        const tabs_array = []
                        let obj = {};
                        const tabs = TASKS[SESSION.id] && TASKS[SESSION.id].tabs;
                        if (tabs) {
                            tabs.forEach(tab => {
                                const clicks = CLICKS[tab.id] || 1;
                                const time_spent = TIME_SPENT[tab.id] || 0;
                                const scroll_value = DISTANCE_SCROLLED[tab.id] && DISTANCE_SCROLLED[tab.id].value || 1;
                                let reopened = parseInt(tab.reopened_times);
                                reopened = reopened || 1
                                const rating = parseFloat((clicks * time_spent * scroll_value) / reopened).toFixed(2)
                                console.log('clicks')
                                console.log(CLICKS)
                                console.log('time spent')
                                console.log(TIME_SPENT)
                                console.log('scroll')
                                console.log(DISTANCE_SCROLLED)


                                console.log('clicks ' + clicks + " time spent " + time_spent + "scroll value " + scroll_value)
                                if (tab.id) {

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
                            /*
                            tabs_to_remove.forEach(item=> {
                                closeTab(item.tab_id, item.classification === 'distraction')
                            })*/

                        }
                    }
                });
            }, 5000)




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
            
            </div>

            <div id="distraction-timer-time" class="distraction-timer-time">
                <p>${timer}</p>
            </div>
        </div>
    </div>`

        /*
        let seconds = timer;
        const timer_interval = setInterval(() => {
            chrome.tabs.query({active: true}, function(tabs) {
                let is_active = false;
                for (tab of tabs) {
                    console.log('tab0')
                    console.log(JSON.stringify(tab))
                    if (parseInt(tab.id)=== tab_id) {
                        is_active = true
                    }
                     
                }

                if (is_active) {
                    seconds++
                }
                else {
                    clearInterval(timer_interval)
                }
            })
        }, 1000)
        const timer_el = document.getElementById("distraction-timer-time");
        timer_el.innerText = seconds;*/




        document.getElementById('close-distraction-watch').addEventListener('click', function() {

            console.log('close-distraction-watch')
            div.style.display = 'none';

        })

    } catch (e) {
        throw e;
    }

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
                I believe in you! You can do this, once you're done with your distraction marathon.

            </div>

            <div id="blocker-close-message" class="blocker-closer-message" style="margin-bottom: 24px; color: white !important">
                Closing in 10 seconds...
            </div>

            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 64px; width: 60%; margin: auto; margin-top: 16px;;">
                <div>
                    <button id="blocker-close-cta" style="font-size: 16px !important; margin-bottom: 24px; margin-right: 16px; border: 2px solid #4ECB71; color: white !important; background-color: #4ECB71 !important" class="blocker-close-cta"> Close now</button>

                </div>

                <div>
                    <button id="suspend" style="font-size: 16px !important; margin-bottom: 24px; margin-right: 16px; border: 2px solid lightgrey; color: lightgray" class="blocker-close-cta"> Suspend to break time</button>
                    <button id="whitelist" style="font-size: 16px !important;margin-bottom: 24px; margin-right: 16px; border: 2px solid lightgrey; color: lightgray" class="blocker-close-cta"> Whitelist www.google.com for this session</button>
                    <button id="ignore-once" style="font-size: 16px !important;margin-bottom: 24px; border: 2px solid lightgrey; color: lightgray" class="blocker-close-cta">Ignore once</button>
                </div>
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
        DISTRACTIONS_COUNTER++

        modal_div.style.display = "none"

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
}


chrome.runtime.onMessage.addListener((message) => {
    if (message.message === "clear-interval") {
        if (message.data.name === 'total_distraction_time') {}
    }
    if (message.message === 'get-total-distraction-time') {
        chrome.runtime.sendMessage({
            message: 'total-distraction-time',
            data: {
                time: GLOBALS.total_distraction_time
            }
        })
    }
})

function onTabActivated(tab) {
    console.log('tab activated')
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



    chrome.tabs.onActivated.addListener(async (tab, changeInfo, ) => {
        console.log('tab on Activated')
        console.log(Object.keys(tab))
        onTabActivated(tab)



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


    });



    chrome.tabs.onRemoved.addListener(async (tabId) => {
        try {


            clearInterval(tabId)
            onRemoveTab(tabId)

        } catch (e) {

        }
    })




    function computeReopenedTimes(tab) {
        return
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




    chrome.runtime.onMessage.addListener((message) => {

        if (message.message === 'find-active-session') {
            chrome.runtime.sendMessage({
                "message": 'activeSession',
                session: SESSION
            });
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
            GLOBALS.previous_tab_id = null


            TASKS[SESSION.id] = {
                ...TASKS[SESSION.id],
                ended_at: new Date().getTime(),
                meta: {
                    DISTRACTIONS: DISTRACTIONS_COUNTER,
                    DISTRACTIONS_CLOSED: DISTRACTIONS_CLOSED,
                    TOTAL_TASK_TIME: GLOBALS.total_task_time,
                    TOTAL_DISTRACTION_TIME: GLOBALS.total_distraction_time,
                    TASKS_CLOSED: GLOBALS.TASKS_CLOSED
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
                    }




                    // clear the timer 
                    clearInterval(GLOBALS.total_task_time_interval);
                    clearInterval(GLOBALS.break_due_interval);
                    clearInterval(GLOBALS.break_time_interval);



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
        const tabId = tab.id;
        let is_distraction = null;


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
                    if (description) {
                        query.description = description
                    }

                    const result = await sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/sessions/rel', "POST", query)
                    const relevance = result.data;

                    if (relevance && relevance <= 5) {
                        TASKS[SESSION.id].visited_urls[tab.url].verdict = 'distraction';
                        TASKS[SESSION.id].visited_urls[tab.url].relevance = relevance


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

                        const focused_tab = TASKS[SESSION.id].tabs.find(t => parseInt(t.id) === tab.id);
                        if (focused_tab) focused_tab.classification = 'distraction'

                        is_distraction = true;



                        return false;
                    } else {
                        // set to task 
                        TASKS[SESSION.id].visited_urls[tab.url].verdict = 'task';
                        TASKS[SESSION.id].visited_urls[tab.url].relevance = relevance

                        const focused_tab = TASKS[SESSION.id].tabs.find(t => t.id === tab.id);
                        if (focused_tab) focused_tab.classification = 'task'



                    }


                    // if the function hasn't returned yet here, then it means that the tab in focus is not a distraction
                    // thus, clear the interval

                } catch (e) {
                    throw e
                }

            }
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




    async function closeTab(tab, distraction = false) {
        try {

            if (distraction) {
                DISTRACTIONS_COUNTER++
            }

            let tab_id;
            if (typeof(tab) === 'object') {
                tab_id = tab.id
            } else {
                tab_id = tab;
                // tab = 
                if (TASKS[SESSION.id]) {

                    chrome.tabs.get(parseInt(tab_id), (t) => {
                        if (distraction) {
                            DISTRACTIONS_CLOSED++
                        } else {
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
                                                favIconUrl: tab.favIconUrl,
                                                title: tab.title,
                                                url: new URL(tab.url).hostname,
                                                closed: true,
                                                full_url: tab.url
                                            };

                                        }

                                    } catch (e) {
                                        throw e
                                    }
                                }




                            }
                            //throw e
                        } catch (e) {}

                    })
                }
            }



        } catch (e) {}

    }

