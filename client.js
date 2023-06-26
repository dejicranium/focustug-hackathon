/**
 * 
 * WHAT SHOULD BE THE STRUCTURE OF A TAB
 * 
 * title 
 * times spent
 * relevancy 
 * description
 * 
 */

let activeSession = false

const GLOBALS = {
    loading: false,
    summary: '',
    seconds: 0,
    timer_interval: null
}

const ELEMENTS = {

    'AUTH_ERROR': document.getElementById('auth-error'),

    'RECENT_TASKS_CONTENTT': document.getElementById('recent-tasks-content'),
    
    
    'TASKS_TABS_CLOSED': document.getElementById('tasks-tabs-closed'),
    'DISTRACTIONS_TABS_CLOSED': document.getElementById('dis-tabs-closed'),
    "TASKS_TABS_CLOSED_DROPDOWNS" : document.getElementById('tasks-tabs-closed-dropdown'),
    "TASKS_TABS_OPENED_DROPDOWNS" : document.getElementById('tasks-tabs-opened-dropdown'),
    "DISTRACTIONS_TABS_CLOSED_DROPDOWNS" : document.getElementById('dis-tabs-closed-dropdown'),
    "DISTRACTIONS_TABS_OPENED_DROPDOWNS" : document.getElementById('dis-tabs-opened-dropdown'),

    
    "SETTINGS_ICON" : document.getElementById('settings-icon'),
    "SETTINGS_CONTAINER" : document.getElementById('settings'),
    "SETTINGS_BACK" : document.getElementById('settings-back'),
    "SETTINGS_SAVE" : document.getElementById('settings-save'),

    "SETTINGS_TONE_1" : document.getElementById('settings-icon'),
    "SETTINGS_TONE_2" : document.getElementById('settings'),
    "SETTINGS_OPTIMAL_TABS" : document.getElementById('settings-optimal-tabs'),

    "CREATE_CONTAINER" : document.getElementById('create-container'),
    "TASK_CONTAINER" : document.getElementById('task-container'),

}

function openDatabase(dbName) {
    return new Promise((resolve, reject) => {
        var request = indexedDB.open(dbName, 1);
        resolve(request)

    })
}


function getClosedTabs() {
    const tabs = chrome.runtime.sendMessage({message: 'get-closed-tabs'});
}

async function createSession(task, break_time = {}, summary=null){

    // the function that actually creates the session. Through message passing
    try {

        const now = Date.now();
        let id = `tsk_${now}`
    
        chrome.runtime.sendMessage( {message: 'create-active-session',
                                            task_id:  id,
                                            task_name: task,
                                            summary: summary,
                                            break_time});
    
        // disable the butotn

        const createContainer = document.getElementById('create-container');
        createContainer.style.display = "none";
    
        const taskContainer = document.getElementById('task-container');
        taskContainer.style.display = 'block'
    }catch(e) {
        console.log(e.stack)
    }

}

async function sendRequest(url, method, body, headers={}) {
    try {
            const obj = {
                method,
                headers: {
                    ...headers, 
                    "Content-Type": 'application/json'
                }
            }

            if (method && method.toLowerCase() !== 'get') {
                if (body) obj.body = JSON.stringify(body)
            }
            return await fetch(url, obj).then(resp=>{
                return resp.json()
            }).catch(err=>{
                throw err
            })
        
        
    }
    catch(e) {
        //alert(e)
        console.log(e)
    }
}

async function startTime() {
    seconds = GLOBALS.seconds
    
    setInterval(() => {
        GLOBAL.seconds++;

        // set the timer element 
        const task_time_el = document.getElementById('task-timer');
        if (task_time_el) {
            let time = 0;
            if (seconds <60) {
                time = `${seconds} secs`
            }
            else if (seconds <= 3600) {
                const decimal = parseFloat(seconds/3600).toFixed(2);
                const mins = `${parseInt(decimal)} mins`;
                time = mins

            }
            else{
                const decimal = parseFloat(seconds/3600).toFixed(2);
                const hours = parseInt(decimal);
                const mins = decimal.split('.').length >1 ? decimal.split('.')[1] : 00;

                time = `${hours} hour ${mins} mins`
            }

            console.log("time is " + time)

            task_time_el.innerText = "" + time;
        }
        
    }, 1000)
}


async function tabsHandler() {
    let activeTab = 'task';

    const task_tab = document.getElementById('task-tab');
    const stats_tab = document.getElementById('stats-tab');
    const recent_tasks_tab = document.getElementById('recent-tasks-tab');
    const settings_tab = document.getElementById('settings-tab')
    // add the class
    
    if (activeTab === "task") {
        task_tab.classList.add('tab-selected');
        stats_tab.classList.remove('tab-selected');
        recent_tasks_tab.classList.remove('tab-selected');
        

        // show the create div
        document.getElementsByClassName('create')[0].style.display = 'block';
        document.getElementById('stats').style.display = 'none';
        document.getElementById('recent-tasks').style.display = 'none';
    }

    /*
    else if (activeTab === 'stats') {
        task_tab.classList.remove('tab-selected');
        stats_tab.classList.add('tab-selected')
        recent_tasks_tab.classList.remove('tab-selected');

        document.getElementsByClassName('create')[0].style.display = 'none';
        document.getElementById('stats').style.display = 'block';
        document.getElementById('recent-tasks').style.display = 'none';

    }
    else if (activeTab === 'recent-tasks') {
        recent_tasks_tab.classList.add('tab-selected');
        task_tab.classList.remove('tab-selected');

        stats_tab.classList.remove('tab-selected')


        document.getElementsByClassName('create')[0].style.display = 'none';
        document.getElementById('stats').style.display = 'none';
        document.getElementById('recent-tasks').style.display = 'block';

    }*/

    for (tab of document.getElementsByClassName('landing-tab')) {

        tab.addEventListener('click', function(e) {


            if (e.target.id === 'task-tab') {
                task_tab.classList.add('tab-selected');
                stats_tab.classList.remove('tab-selected');
                recent_tasks_tab.classList.remove('tab-selected');
                settings_tab.classList.remove('tab-selected')


                document.getElementsByClassName('create')[0].style.display = 'block';
                document.getElementById('stats').style.display = 'none';
                document.getElementById('recent-tasks').style.display = 'none';
                document.getElementById('settings').style.display = 'none';
            }
            else if (e.target.id === 'stats-tab') {
                task_tab.classList.remove('tab-selected');
                stats_tab.classList.add('tab-selected')
                recent_tasks_tab.classList.remove('tab-selected');
                settings_tab.classList.remove('tab-selected')





                const containers = document.getElementsByClassName('landing-container');
                
                for (element of containers) {
                    element.style.display = 'none'


                }

                document.getElementById('stats').style.display = 'block';
            }
            else if (e.target.id === 'recent-tasks-tab') {
                task_tab.classList.remove('tab-selected');
                stats_tab.classList.remove('tab-selected')
                recent_tasks_tab.classList.add('tab-selected');
                settings_tab.classList.remove('tab-selected')


                const containers = document.getElementsByClassName('landing-container');
                
                for (element of containers) {
                    element.style.display = 'none'


                }



                document.getElementById('recent-tasks').style.display = 'block';
               
            }
            else if(e.target.id === 'settings-tab') {
                task_tab.classList.remove('tab-selected');
                stats_tab.classList.remove('tab-selected')
                recent_tasks_tab.classList.remove('tab-selected');
                settings_tab.classList.add('tab-selected')

                const containers = document.getElementsByClassName('landing-container');
                
                for (element of containers) {
                    element.style.display = 'none'


                }
               


                document.getElementById('settings').style.display = 'block';

                /*
                document.getElementsByClassName('create')[0].style.display = 'none';
                document.getElementById('stats').style.display = 'block';
                document.getElementById('recent-tasks').style.display = 'none';
                document.getElementById('settings').style.display = 'block';*/

            }
        })
    }


    
    


    // event listeners; 

    
}

async function createSessionHandler() {
    const triggerEl = document.querySelector('#start-session-btn');
    
    const charsLeft = document.querySelector('#start-session-counter');
    
    const textarea = document.querySelector('#textarea');

    if (textarea) {
        textarea.addEventListener('keydown', function(e) {
            const max = 140;
            // value of textarea 
            let value = textarea.value;
            let left = max - value.length;
            
            if (value.length <= max) {
               // e.preventDefault()
               charsLeft.innerText = `${left}`;

            }
            else {
                const BACKSPACE = 8;
                const DELETE = 46;
                if (![BACKSPACE, DELETE].includes(e.which)) {
                    
                    e.preventDefault()
                }
            }
        })
    }


    let FLAG_BREAK_EXISTS = false;

    /* add break time button */

    /*
    const add_break_el = document.getElementById('add-break');
    const break_el = document.getElementById('break-time')
    add_break_el.addEventListener('click', function () {
        add_break_el.style.visibility = 'hidden';
        break_el.style.display = 'block';
        FLAG_BREAK_EXISTS = true;
    }) */

    
    /* delete break time button */
    /*
    const delete_break_button = document.getElementById('delete-break');
    delete_break_button.addEventListener('click', function() {
        break_el.style.display = 'none';
        add_break_el.style.visibility = 'visible';
        FLAG_BREAK_EXISTS = false;
    })&/



    /* constraints for the break inputs*/
    const break_duration_input = document.getElementById('break-duration-input')
    break_duration_input.addEventListener('keydown', function(e) {
        const backspace_code = 8;
        const delete_code = 46;


        
        if (break_duration_input.value.length === 2 
            && ![backspace_code, delete_code].includes(e.which)) {
            e.preventDefault()
        }
    })



    /* handle break details */

   



    /* create session button */
    
    
    try {
        triggerEl.addEventListener('click', async () => {
            document.getElementById("task-creation-error").style.display = "none";
            // disable the button
            //triggerEl.disabled = true;
            

            // initiate loading 

            const task = document.getElementById('textarea').value;
            if (!task || task && task.length === 0) {
                document.getElementById("task-creation-error").style.display = "block";
                document.getElementById("task-creation-error").innerText = "Please enter a description";
                return;
            }
            
            let loadingContainer = document.getElementsByClassName('lds-container')[0];
            const createContainer = document.getElementById('create-container');
        

            if (createContainer) {
                createContainer.style.display  = 'none'
            }
            if (loadingContainer) {
                loadingContainer.style.display = "flex";
            }
            
            
            
            
            const result = await sendRequest("https://leapstartlabapi.herokuapp.com/api/v1/sessions/start", "POST", {task})
            let summary = result && result.data && result.data.data || task;
            //alert(JSON.stringify(summary))
            //let  summary = 'something something'
            //let summary = task;
            GLOBALS.summary = summary;
            try {
                summary = JSON.parse(summary)
            }catch(e) {
                summary = summary;
            }

            if (summary) {

                const break_time = {

                }

                if (document.getElementById('break-time').style.display !== 'none') {
                   // console.log('flag exists')
                    const break_frequency = document.getElementById('break-frequency');
                    break_time.duration = break_duration_input.value && parseInt(break_duration_input.value)
                    break_time.frequency = break_frequency.value && parseInt(break_frequency.value)
                }

                let loadingContainer = document.getElementsByClassName('lds-container')[0];

                await createSession(summary, break_time, summary)
                loadingContainer.style.display = 'none';



                // show summary element
                
                const task_summary_el = document.getElementById('task-summary');

                if (task_summary_el) task_summary_el.innerText = summary;
            }
                
            



            
        });
        
    }
    catch(e) {
        console.log(e)
    }

   
}

async function handleSearch() {
    const el = document.getElementById('search');
    if (el) {
        el.addEventListener('keyup', function() {
            const value = el.value;

            const search_results_content = document.getElementById('search-results-content');
            const work_tabs = document.getElementById('work-tabs');

            const dis_tabs = document.getElementById('dis-tabs');

            if (value && value.length > 0) {
                let results = []
                chrome.runtime.sendMessage({message: 'search-closed-tabs', data: {
                    search_term: value
                }})
                

                chrome.runtime.onMessage.addListener((message)=> {
                    if (message.message === 'closed-tabs-search-results'){
                        results = message.data.results;
                        console.log('got search results')
                        console.log(results)

                        if (results.length > 0) {
                            search_results_content.style.display = 'block';
                            // hide work tab 
                            work_tabs.style.display = 'none'

                            dis_tabs.style.display = 'none'

                            
                            search_results_content.innerHTML = ''
                            results.forEach(result => {
                                if (result.classification === 'distraction') {
                                    // set background 
                                    search_results_content.style.background = "rgba(169, 15, 61, 0.2)";

                                    search_results_content.innerHTML += `
                                    <div class="work-tabs-tab tabs-group-tab" style="cursor: pointer">
                                            <div class="work-tabs-tab-img tabs-group-tab-img">
                                            <img src="${result.favIconUrl}"></img>
                
                                            </div>
                                            <div class="work-tabs-tab-details tabs-group-tab-details">
                                                <p>${result.url}</p>
                                                <p>${result.title}</p>
                                            </div>
                                            <button data-id="${result.id}" data-website="${result.full_url}" class="search-restore-btn" id="distraction-restore-btn">Restore</button>
                                        </div>`
                                }
                                else {
                                    search_results_content.style.background = "rgba(15, 169, 88, 0.2)";

                                    search_results_content.innerHTML += `
                                    <div class="work-tabs-tab tabs-group-tab" style="cursor: pointer">
                                            <div class="work-tabs-tab-img tabs-group-tab-img">
                                            <img src="${result.favIconUrl}"></img>
                
                                            </div>
                                            <div class="work-tabs-tab-details tabs-group-tab-details">
                                                <p>${result.url}</p>
                                                <p>${result.title}</p>
                                            </div>
                                            <button  data-id="${result.id}" data-website="${result.full_url}"  class="search-restore-btn" id="distraction-restore-btn">Restore</button>
                                        </div>`
                                }
                            })
                        }
                        else {
                            
                            search_results_content.innerHTML = "No tabs found"
                            search_results_content.style.display = 'flex'
                            //search_results_content.style.height = '100px';
                            search_results_content.style.color = 'grey';
                            search_results_content.style.justifyContent = 'center'
                            search_results_content.style.alignItems = 'center'

                            
                        }
                        
                        
                    }
                })
                
            }
            else {
                work_tabs.style.display = 'block';
                dis_tabs.style.display = 'block';
                search_results_content.style.display = 'none';

            }
           

            // click handler
            const buttons = document.getElementsByClassName("search-restore-btn");
            for (let i = 0; i < buttons.length; i++) {
               const button = buttons[i];
               button.addEventListener('click', function(e) {
                   const id = e.target.dataset.id;
                   const website = e.target.dataset.website;

                   chrome.runtime.sendMessage({message: "restore-tab", data: { id: id }})
                  
                   chrome.tabs.create({active: true, url: website })
               })
            }
            
            
        })
    }
}

async function stopSessionHandler() {
    const triggerEl = document.getElementById('stop-session');
    if (triggerEl) {
        triggerEl.addEventListener('click', () => {

            //chrome.storage.local.clear();
            chrome.runtime.sendMessage({message: 'close-session'})
            
            const createContainer = document.getElementById('create-container');
            createContainer.style.display = "block";
        
            const taskContainer = document.getElementById('task-container');
            taskContainer.style.display = 'none'
        })
    }
}

async function expandClosedTabs() {
    ELEMENTS.TASKS_TABS_CLOSED_DROPDOWNS.addEventListener('click', () => {
        const content_el = document.getElementById("task-tabs-content");
        if (content_el.style.display === 'block') {
            content_el.style.display = 'none';
        }
        else if (GLOBALS.tasks_tabs_closed.length > 0){
          
            content_el.style.display = 'block';
            content_el.classList.add('enter')
            
        }
        
    })

    ELEMENTS.DISTRACTIONS_TABS_CLOSED_DROPDOWNS.addEventListener('click', () => {
        const content_el = document.getElementById('dis-tabs-content');
        if (content_el.style.display === 'block') {

            content_el.style.display = 'none';
        }
        else if (GLOBALS.distraction_tabs_closed.length > 0){
            content_el.style.display = 'block';
            content_el.classList.add('enter')


        }
    })
}


chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {

    if (request.message == 'plan-expired' && request.data.expired) {
       // alert(request.message)
        document.getElementById('trial-ended').style.display = "block"
        document.getElementById('trial-ended__notif').innerHTML = "Your plan has expired. You can upgrade your plan and click on <b>Refresh</b> to continue blocking distractions."
        document.getElementById('create-container').style.display = 'none'
        document.getElementById('task-container').style.display = 'none'
        document.getElementById('refresh-plan-status').addEventListener('click', function(e) {
            refreshUserPlanStatus(e);
            
        });

        
    }
    if (request.message === 'activeSession' && request.session && request.session.id) {
        document.getElementById('create-container').style.display = 'none'
        document.getElementById('task-container').style.display = 'block';


        const task_summary_el = document.getElementById('task-summary');

        if (task_summary_el) task_summary_el.innerText = request.session.summary;

        activeSession = true;

    }
    if(request.message === 'activeSession' && !request.session.id) {
        document.getElementById('task-container').style.display = 'none';
        document.getElementById('create-container').style.display = 'block'

    }


    if (request.message == 'total-task-time') {
        const total_task_time = request.data.time;
        
        const timer_el = document.getElementById('task-timer')
        const seconds = total_task_time;

        let time = ''

        if (seconds < 60) {
            time = `${seconds} seconds`
        }
        else if (120 < seconds < 3600) {
            if(parseInt(seconds/60)){
            time = `${parseInt(seconds/60)} mins`
            }
            else time = `${parseInt(seconds/60)} mins`
        }
        else{
            time = parseInt(seconds/3600) += ' hrs'
        }
        timer_el.innerHTML =  ''  + time;


    }
    if(request.message === 'total-distraction-time') {
        const total_distraction_time = request.data.time;
        const timer_el = document.getElementById('distraction-timer')
        const seconds = total_distraction_time;

        console.log('distraction seconds')
        console.log(seconds)

        let time = ''

        if (seconds < 60) {
            time = `${seconds} seconds`
        }
        else if (120 < seconds < 3600) {
            if(parseInt(seconds/60)){
                time = `${parseInt(seconds/60)} min`
            }
            else time = `${parseInt(seconds/60)} mins`
        }
        else{
            time = parseInt(seconds/3600) += ' hrs'
        }
        timer_el.innerHTML =  time;
    }
    
    if (request.message === 'closedTabs' &&  request.data) {
        GLOBALS.closed_tabs = request.data;

        console.log(JSON.stringify(GLOBALS.closed_tabs))
    
        GLOBALS.tasks_tabs_closed = request.data.filter(tab=> tab.classification === 'task');
        GLOBALS.distraction_tabs_closed = request.data.filter(tab=> tab.classification === 'distraction');

        ELEMENTS["DISTRACTIONS_TABS_CLOSED"].innerText =  GLOBALS.distraction_tabs_closed.length === 1 ? '1 tab closed' :  GLOBALS.distraction_tabs_closed.length + ' tabs closed'
        ELEMENTS["TASKS_TABS_CLOSED"].innerText = GLOBALS.tasks_tabs_closed.length ==1 ? '1 tab closed':  GLOBALS.tasks_tabs_closed.length + ' tabs closed';

        const tasks_container_div = document.getElementById('task-tabs-content');
        const distractions_container_div = document.getElementById('dis-tabs-content');
        
        
        if(GLOBALS.tasks_tabs_closed?.length > 0) {
            GLOBALS.tasks_tabs_closed.forEach(item=> {
                tasks_container_div.innerHTML += `
                <div class="work-tabs-tab tabs-group-tab">
                    <div class="work-tabs-tab-img tabs-group-tab-img">
                        <img src="${item.favIconUrl}"></img>
                            
                    </div>
                    <div class="work-tabs-tab-details tabs-group-tab-details">
                        <p>${item.url}</p>
                        <p>${item.title}</p>
                    </div>
                    <button class="restore-button" data-id='${item.id}' data-website='${item.full_url}'>Restore</button>
                </div>`
                
             })
            
        }
        
        if (GLOBALS.distraction_tabs_closed?.length > 0) {
            GLOBALS.distraction_tabs_closed.forEach(item=> {
                distractions_container_div.innerHTML += `
                <div class="dis-tabs-tab tabs-group-tab">
                    <div class="dis-tabs-tab-img tabs-group-tab-img">
                        <img src="${item.favIconUrl}"></img>
                            
                    </div>
                    <div class="dis-tabs-tab-details tabs-group-tab-details">
                        <p>${item.url}</p>
                        <p>${item.title}</p>
                    </div>
                    <button class="restore-button"   data-id='${item.id}' data-website='${item.full_url}'>Restore</button>
                </div>`
                
             })
        }

        restoreTabhandler()

     }

     if (request.message == 'recent-tasks' && request.data) {
        console.log("RECENT TASKS")
        const tasks = request.data.tasks;

        console.log(typeof(tasks))
        console.log(tasks)
        
        if (tasks && Object.keys(tasks).length > 0) {
            //document.getElementsByClassName('recent-tasks')[0].style.display = 'block'
        }
        
        
        Object.keys(tasks).reverse().forEach(task=> {
            task = tasks[task]
            //console.log('getting task ' + task.summary)
            ELEMENTS.RECENT_TASKS_CONTENTT.innerHTML += `
                <div class='recent-tasks-task'>
                    <div class="recent-tasks-task-detail">
                        <p style="color: lightgrey">${task.summary}</p>
                        <div style="display: flex">
                            <div style="display:flex; align-items:center; margin-right: 16px; color: #4ECB71;">
                                <!--- <svg style="margin-right: 8px" width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 10C2.76 10 2.55 10.09 2.41 10.25C2.27 10.4 2.21 10.62 2.24 10.86L2.74 13.85C2.82 14.5 3.4 15 4 15H7C7.64 15 8.36 14.44 8.5 13.82L9.56 10.63C9.6 10.5 9.57 10.31 9.5 10.19C9.39 10.07 9.22 10 9 10H3ZM7 17H4C2.38 17 0.960002 15.74 0.760002 14.14L0.260002 11.15C0.150002 10.3 0.390002 9.5 0.910002 8.92C1.43 8.34 2.19 8 3 8H9C9.83 8 10.58 8.35 11.06 8.96C11.17 9.11 11.27 9.27 11.35 9.45C11.78 9.36 12.22 9.36 12.64 9.45C12.72 9.27 12.82 9.11 12.94 8.96C13.41 8.35 14.16 8 15 8H21C21.81 8 22.57 8.34 23.09 8.92C23.6 9.5 23.84 10.3 23.74 11.11L23.23 14.18C23.04 15.74 21.61 17 20 17H17C15.44 17 13.92 15.81 13.54 14.3L12.64 11.59C12.26 11.31 11.73 11.31 11.35 11.59L10.43 14.37C10.07 15.82 8.56 17 7 17ZM15 10C14.78 10 14.61 10.07 14.5 10.19C14.42 10.31 14.4 10.5 14.45 10.7L15.46 13.75C15.64 14.44 16.36 15 17 15H20C20.59 15 21.18 14.5 21.25 13.89L21.76 10.82C21.79 10.62 21.73 10.4 21.59 10.25C21.5154 10.1684 21.4241 10.1038 21.3223 10.0606C21.2205 10.0175 21.1105 9.9968 21 10H15Z" fill="#4ECB71"/>
                                </svg>--->
                                ${task.meta.TASK_TABS || 0} task tabs

                            </div>

                            <!--
                            <div style="display:flex; align-items:center; color: #A90F3D">
                                <svg  style="margin-right: 8px" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.44445 10.8634C1.50784 9.70794 0.997753 8.26516 1.00001 6.77778C1.00001 3.18833 3.91056 1 7.5 1C11.0894 1 14 3.18833 14 6.77778C14 8.3255 13.4583 9.74756 12.5556 10.8634M2.44445 10.8634V12.5556C2.44445 12.9386 2.59663 13.306 2.86752 13.5769C3.1384 13.8478 3.5058 14 3.88889 14H11.1111C11.4942 14 11.8616 13.8478 12.1325 13.5769C12.4034 13.306 12.5556 12.9386 12.5556 12.5556V10.8634M2.44445 10.8634H3.52778M12.5556 10.8634H11.4722" stroke="#A90F3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M4.61112 8.22222C5.00999 8.22222 5.33334 7.89887 5.33334 7.49999C5.33334 7.10112 5.00999 6.77777 4.61112 6.77777C4.21225 6.77777 3.8889 7.10112 3.8889 7.49999C3.8889 7.89887 4.21225 8.22222 4.61112 8.22222Z" stroke="#A90F3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M5.33334 12.5556V14M7.50001 12.5556V14M9.66667 12.5556V14M6.77779 10.3889L7.50001 8.94444L8.22223 10.3889H6.77779Z" stroke="#A90F3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M10.3889 8.22222C10.7878 8.22222 11.1111 7.89887 11.1111 7.49999C11.1111 7.10112 10.7878 6.77777 10.3889 6.77777C9.99002 6.77777 9.66667 7.10112 9.66667 7.49999C9.66667 7.89887 9.99002 8.22222 10.3889 8.22222Z" stroke="#A90F3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                ${task.meta.DISTRACTIONS_CLOSED || 0}
    
                            </div> -->
                            
                        </div>

                    </div>
                    <button class="restart-session" data-sessionid="${task.meta.ID}">Restart </button>
                </div>
            `
        })


        const restart_buttons = document.getElementsByClassName('restart-session');
        for (button of restart_buttons) {
            button.addEventListener('click', (event) => {
                const session_id = event.target.dataset.sessionid;
                chrome.runtime.sendMessage({message: "restart-session", data: {id: session_id} })
                document.getElementById('task-container').style.display = 'block';
                document.getElementById('recent-tasks').style.display = 'none';
                document.getElementById('create-container').style.display = 'none';
            })
        }
    }
     if (request.message == 'relevanceRating') {


       // alert(request.data.relevance)
        
        
    
    }

    if (request.message == 'new-version-exists' && request.data.new === true) {
        console.log('new version exists')
        document.getElementById('latest-version').style.display = 'block';
        document.getElementById('create-container').style.display = 'none'
        document.getElementById('onboarding').style.display = 'none' 
        document.getElementById('break-time-alert').style.display = 'none'
        document.getElementById('break-time-ongoing').style.display = 'none'
        document.getElementById('auth').style.display = 'none'
        document.getElementById('settings').style.display = 'none'
        document.getElementById('create-container').style.display = 'none'
    }
  });

  

  /*
  chrome.runtime.onMessage.addListener((message)=>{
    if (message.message === 'activeSession') {
     if (message.data) {
         alert(JSON.stringify(message))
         
     }
    }
  });*/


function showToast(type, text, position="top") {
    const div = document.createElement('div');

    if (type === 'success') {

        div.style.background = 'green';
    }else if (type === 'error') {
        div.style.background = 'red'
    }
    div.style.height = '50px';
    div.style.width = '100%';
    div.style.textAlign = 'center';
    div.style.color = 'white';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.fontWeight = '500'
    div.attributes.id = new Date();
    div.innerText = text;
    
    if (position === 'top') {

        document.body.prepend(div)
        document.body.scrollTo({top: 0, behavior: 'smooth'})
    }
    else {
        document.body.append(div)
        document.body.scrollTo({bottom: 0, behavior: 'smooth'})
    }
    
    
    setTimeout(() => {
        div.remove()
    }, 3000)
}

function setSettingsHandler() {

    const add_lock_site_button = document.getElementById('add-lock-site-btn');
    const hard_lock_content = document.getElementById('hard-lock-content');
    const save_hard_lock_changes = document.getElementById('save-hard-lock-btn');


    const settings = {
        TONE: 'normal',
        OPTIMAL_TABS: 5,
        LOCKED_SITES: [],
    }

    /*
    ELEMENTS.SETTINGS_ICON.addEventListener('click', () => {
        ELEMENTS.SETTINGS_CONTAINER.style.display = 'block';

        ELEMENTS.CREATE_CONTAINER.style.display = 'none'
        ELEMENTS.TASK_CONTAINER.style.display = 'none'
    })*/

    //settings back
    /*
    ELEMENTS.SETTINGS_BACK.addEventListener('click', () => {
        if (activeSession) {
            ELEMENTS.SETTINGS_CONTAINER.style.display = 'none'
            ELEMENTS.CREATE_CONTAINER.style.display = 'none'

            ELEMENTS.TASK_CONTAINER.style.display = 'block';
        }
        else {
            ELEMENTS.SETTINGS_CONTAINER.style.display = 'none'
            ELEMENTS.CREATE_CONTAINER.style.display = 'block'
            ELEMENTS.TASK_CONTAINER.style.display = 'none';
        }
        
    })*/


    chrome.storage.sync.get(null, async (settings) => {
        if (settings.LOCKED_SITES && settings.LOCKED_SITES.length > 0) {
            // popultate

            for (let i = 0; i < settings.LOCKED_SITES.length; i++) {
                const index= i;
                const locked_site = settings.LOCKED_SITES[i]


                const new_lock_element = document.createElement('div');
                new_lock_element.classList.add('lock-item');
                new_lock_element.dataset.lockitem = index;
                new_lock_element.innerHTML = `
                <div style="width: 90%" data-lockitem='${index}'>
                    <input class="lock-item-input" style="width:100%" type="text" placeholder="facebook.com" value="${locked_site}">
                    </div>
                    <div style="margin-left: 8px; width: 10%; display: flex; flex-direction: row; justify-content: flex-end; align-items: center;" >
                        <img style="display:block" class="lock-item-cancel" data-lockitem='${index}' src="./images/cross_mark.png"/>

                       
        
                    </div>
                </div>`
                hard_lock_content.appendChild(new_lock_element)
            }
            
        }
        else {
            const new_lock_element = document.createElement('div');
            new_lock_element.classList.add('lock-item');
            new_lock_element.dataset.lockitem = '0'
            new_lock_element.innerHTML = `
            <div style="width: 90%">
                <input class="lock-item-input" style="width:100%; margin-right: 8px;" type="text" placeholder="facebook.com">
                </div>
                <div  style="width: 10%; display: flex; margin-left: 8px; flex-direction: row; justify-content: flex-end; align-items: center;" >
                    <img  style="display:block" class="lock-item-cancel" data-lockitem="0"  src="./images/cross_mark.png"/>
                    
    
                </div>
            </div>`
            hard_lock_content.appendChild(new_lock_element) 
        }





        const hard_lock_cancel_items = document.getElementsByClassName('lock-item-cancel');

        for (let cancel_item of hard_lock_cancel_items) {

            //alert(JSON.stringify(cancel_item))
            cancel_item.addEventListener('click', (e) => {

                let element = e.target;
                let index  = element?.dataset.lockitem;
                while(!index) {
                    element = e.parentNode;
                    index = element.dataset.lockitem
                    
                }
                
            
                //alert('somoething')
    



    
                // get all lock-items;
                const lock_items = document.getElementsByClassName('lock-item');
    
                for (let item of lock_items) {
                    //item.dataset.lockitem)
                    if (parseInt(item.dataset.lockitem) === parseInt(index)) {
                        item.remove()
                    }
                }
    
    
            })
        }
    
    
    })

    
    save_hard_lock_changes.addEventListener('click', (e) => {
        // scroll through the lock items and get values;

        chrome.storage.sync.get(null, (settt) => {
            const LOCKED_SITES = settt.LOCKED_SITES;

            const lock_items = document.getElementsByClassName('lock-item-input');
            let error = false
            for (input of lock_items) {
                if (input.value && input.value.indexOf(".") === -1) {
                    // 
                    showToast('error', "Please enter website")
                    error = true;
                }
    
                else if (LOCKED_SITES.indexOf(input.value)) {
                    
                }
                else {
    
                    settings.LOCKED_SITES.push(input.value)
                   
                }
                //alert(JSON.stringify(settings))
            }
    
            if (!error) {
                chrome.storage.sync.set(settings)
    
                showToast('success', 'Saved locked sites')
            }
        })


        
    })


    
    
    const tone_choices = document.getElementsByClassName('settings-character');
    //alert(JSON.stringify(tone_choices))
    for (let i = 0; i < tone_choices.length; i++) {
        let choice = tone_choices[i]
       
        
        choice.addEventListener('click', (el) => {




            // fist of remove this classlist from all elements;
            for (let a= 0; a < tone_choices.length; a++){
                const tone_choice =tone_choices[a];
                tone_choice.classList.remove('tone-chosen')
            }





            let element = el.target;
           
            if (Object.values(element.classList).indexOf('settings-character') === - 1) {
                while (Object.values(element.classList).indexOf('settings-character')  == -1) {
                    element = element.parentNode;

                }
                const tone = element.dataset.tone;
                settings.TONE = tone ;
                element.classList.add('tone-chosen')
            }
            else {
                const tone = el.target.dataset.tone;
                settings.TONE = tone 
                el.target.classList.add('tone-chosen')

            }
            
                
        })
    }



    // hard lock

    


    add_lock_site_button.addEventListener('click', function() {
        // add a new lock-item

        //alert('sers')

        //alert('er')

        save_hard_lock_changes.disabled = false;

        
        const lock_items_count = document.getElementsByClassName('lock-item')?.length || 0;
        const new_lock_element = document.createElement('div');
        new_lock_element.classList.add('lock-item');
        new_lock_element.dataset.lockitem = lock_items_count + 1

        new_lock_element.innerHTML = `
        <div style="width: 90%">
             <input class="lock-item-input" style="width:100%; margin-right: 8px;" type="text" placeholder="facebook.com">
            </div>
            <div  style="width: 10%; margin-left: 8px; display: flex; flex-direction: row; justify-content: flex-end; align-items: center;" >
                <img  style="display:block" class="lock-item-cancel" data-lockitem="${lock_items_count + 1}" src="./images/cross_mark.png"/>
                

            </div>
        </div>`

        hard_lock_content.appendChild(new_lock_element)

        const hard_lock_cancel_items = document.getElementsByClassName('lock-item-cancel');

        for (let cancel_item of hard_lock_cancel_items) {

            //alert(JSON.stringify(cancel_item))
            cancel_item.addEventListener('click', (e) => {

                let element = e.target;
                let index  = element?.dataset.lockitem;
                while(!index) {
                    element = e.parentNode;
                    index = element.dataset.lockitem
                    
                }
                
            
                //alert('somoething')
    



    
                // get all lock-items;
                const lock_items = document.getElementsByClassName('lock-item');
    
                for (let item of lock_items) {
                    //item.dataset.lockitem)
                    if (parseInt(item.dataset.lockitem) === parseInt(index)) {
                        item.remove()
                    }
                }
    
    
            })
        }
        
    });


    // 


    // save settings
    ELEMENTS.SETTINGS_SAVE.addEventListener('click', () => {
        //alert('save')
        // save settings
       
        if (ELEMENTS.SETTINGS_OPTIMAL_TABS.value) {
            settings.OPTIMAL_TABS = ELEMENTS.SETTINGS_OPTIMAL_TABS.value
        }

        // get tone chosen
        let tone_chosen = document.getElementsByClassName('tone-chosen')
        if (tone_chosen && tone_chosen[0]) {
            tone_chosen = tone_chosen[0]

            tone = tone_chosen.dataset.tone;
            settings.TONE = tone;
        }

        chrome.storage.sync.set({settings}, function() {
            //console.log('saved')
        });


        const lock_items = document.getElementsByClassName('lock-item-input');
        for (input of lock_items) {
            if (input.value) {

                settings.LOCKED_SITES.push(input.value)
            }
            //alert(JSON.stringify(settings))
        }
        chrome.storage.sync.set(settings)




        chrome.runtime.sendMessage({message: 'find-active-session'}, (response) => {

            //ELEMENTS.SETTINGS_CONTAINER.style.display = 'none';

            if (response.id) {

                ELEMENTS.TASK_CONTAINER.style.display = 'block'
            }
            else {

                showToast('success', "Settings saved")
                /*ELEMENTS.CREATE_CONTAINER.style.display = 'block';
                document.getElementById()
                document.getElementsByClassName('create')[0].style.display = "block"*/
            }
        })
        

        
    })


    
}

function getDistractionsCounter(){
    
    chrome.runtime.onMessage.addListener((message) => {

        if (message.message === 'distractions-closed' && message.data.count) {
            let count = message.data.count;
            if (count == 1) {

                document.getElementById("distractions-closed").innerHTML = count + ' distraction closed' ;
            }
            else {
                document.getElementById("distractions-closed").innerHTML = count + ' distractions closed';

            }
        }
        if (message.message === 'distractions-count' && message.data.count) {
            let count = message.data.count;
            if (count == 1) {

                document.getElementById("distractions-count").innerHTML = count + ' distraction detected';
            }
            else {
                document.getElementById("distractions-count").innerHTML = count + ' distractions detected';

            }
        }
    })
    
}

function restoreTabhandler() {
    const restore_buttons = document.getElementsByClassName('restore-button')
    if (restore_buttons.length > 0) {
        //alert(JSON.stringify(restore_buttons))
        for (let i = 0; i <restore_buttons.length; i++) {
                const button = restore_buttons[i]
                button.addEventListener('click', (el) => {
                    const url = el.target.dataset.website;
                    const id = el.target.dataset.id;
                    //alert('restore')

                    chrome.runtime.sendMessage({message: "restore-tab", data: { id: id }})
                   
                    chrome.tabs.create({active: true, url })

                    
                })
            
        }
    }

}


async function refreshUserPlanStatus(e) {
    chrome.storage.sync.get(null, async(settings) => {


        if (e && e.target) e.target.disabled = true

        const token = settings && settings.auth && settings.auth.USER_TOKEN
        try {

            await sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/users/plans', "GET", null, {"Authorization" : "Bearer " + token}).then(resp=> {
                if (resp && resp.data && resp.data.plan) {
                    // referesh plan
                    document.getElementById('create-container').style.display = 'block'
                    chrome.storage.sync.set({credentials: {PLAN: resp.data.plan}})
                    // store new token

                    chrome.storage.sync.set({auth: {USER_TOKEN: resp.data.new_token}})
                    setUpHandlers()
                   
                    // plan is available
                    document.getElementById('trial-ended').style.display = 'none'

                    chrome.runtime.sendMessage({message: 'plan-upgraded'})

                    //chrome.storage.sync.remove("credentials")
                
                }
                else if (resp.status === false && resp.data && resp.data.indexOf("needs to be renewed") > -1) {
                   // alert(JSON.stringify(resp))
                   document.getElementById('trial-ended').style.display = 'block'

                }
            }).finally( () =>{
                e.target.disabled = false;
            })
        }catch(e) {
            throw e
        }
    })
}

async function login(login_email, login_password, data={}) {
    const auth_container = document.getElementById('auth')
    auth_container.style.display = 'none';

    const loading = document.getElementById('loading');
    const login_btn = document.getElementById('login-btn');

    
    await  sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/auth/login', "POST", {
            email: login_email,
            password:login_password
        }).then(resp=> {
            //alert(resp.data.token)
            if (resp && resp.data && resp.data.token) {
                console.log('credentials')
                console.log(resp.data.user.trial_to_end)
                 chrome.storage.sync.set({auth: {USER_TOKEN: resp.data.token}})
                 chrome.storage.sync.set({credentials: {TRIAL_TO_END: resp.data['user']['trial_to_end'], PLAN: resp.data['user']['plan']}})
     
                 // show the create containe4
             
                 ELEMENTS.CREATE_CONTAINER.style.display = 'block'
                 setUpHandlers()

                 document.getElementById('tabs').style.display = 'flex'

            }
            else {
                //alert(resp.ok)
                   
                auth_container.style.display = 'block'

                login_btn.disabled = false;
                auth_container.style.display = 'block'

                ELEMENTS.AUTH_ERROR.innerText = `Error signing in`
                ELEMENTS.AUTH_ERROR.style.display = 'block';

               // setUpHandlers()
            }
        }).catch(err=> {
            //alert(err)
        })
        .finally(() => {
            
            loading.style.display = 'none'
        })
}


function setUpAuthHandler() {

    document.getElementById('tabs').style.display = 'none';
    const onboarding = document.getElementById('onboarding');
    onboarding.style.display = 'block'

    const auth_container = document.getElementById('auth')

    
    const onboardingGetStarted = document.getElementById('onboarding-getstarted');
    onboardingGetStarted.addEventListener("click", function()  {
        onboarding.style.display = 'none'
        auth_container.style.display = 'block'
    })

    //auth_container.style.display = 'block';

    const loading = document.getElementById('loading');
    
   

    const login_btn = document.getElementById('login-btn');
    
    login_btn.addEventListener('click', async () => {
        const login_email = document.getElementById('login-email').value;
        const login_password = document.getElementById('login-password').value;

        // set button to disabled 
        login_btn.disabled = true;
        loading.style.display = 'flex';
        auth_container.style.display = 'none';
        ELEMENTS.AUTH_ERROR.style.display = 'none'

        

        /*await  sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/auth/login', "POST", {
            email: login_email,
            password:login_password
        }).then(resp=> {
            //alert(resp.data.token)
            if (resp && resp.data && resp.data.token) {
                 chrome.storage.sync.set({auth: {USER_TOKEN: resp.data.token}})
     
                 // show the create containe4
             
                 ELEMENTS.CREATE_CONTAINER.style.display = 'block'
            }
            else {
                //alert(resp.ok)
                   
                auth_container.style.display = 'block'

                login_btn.disabled = false;
                auth_container.style.display = 'block'

                ELEMENTS.AUTH_ERROR.innerText = `Error signing in`
                ELEMENTS.AUTH_ERROR.style.display = 'block'
            }
        }).catch(err=> {
            alert(err)e
        })
        .finally(() => {
            
            loading.style.display = 'none'
        })*/

        login(login_email, login_password)
    })



    
    const register_btn = document.getElementById('register-btn');
    
    register_btn.addEventListener('click', () => {
        const register_password = document.getElementById('register-password').value;
        const register_email = document.getElementById('register-email').value;
        const register_name = document.getElementById('register-name').value;

        // set button to disabled 
        register_btn.disabled = true;

        loading.style.display = 'flex';
        auth_container.style.display = 'none';
        ELEMENTS.AUTH_ERROR.style.display = 'none'


        sendRequest('https://leapstartlabapi.herokuapp.com/api/v1/auth/register', "POST", {
            email: register_email,
            password:register_password,
            name: register_name
        }).then(resp=> {
            
            if (resp && resp.data) {

                showToast('success', "Created account successfully")

                login(register_email, register_password)

            }
            else { 
                register_btn.disabled = false;
                auth_container.style.display = 'block';

                ELEMENTS.AUTH_ERROR.innerText  = "Error signing up"
                ELEMENTS.AUTH_ERROR.style.display = 'block'
            }
        }).catch(err=> {
            console.log(e)
        }).finally(() => {
            loading.style.display = 'none';
        })
    })

    const switch_register = document.querySelector('#switch-register')
    const switch_login = document.querySelector('#switch-login')

    switch_register.addEventListener('click', function() {
        document.getElementById('login').style.display = 'none'
        document.getElementById('register').style.display = 'block'
    })
    switch_login.addEventListener('click', function() {
        document.getElementById('login').style.display = 'block'
        document.getElementById('register').style.display = 'none'
    })

    

    

}


function handleBreakTime() {
    chrome.runtime.onMessage.addListener((message)=> {
        if (message.message  === 'break-time-due') {
            console.log('break time due')
            if (message.data.due === true) {
                document.getElementById('break-time-alert').style.display = 'block'
                let time = message.data.duration;
                time = parseInt(time/60000);
                if (time) {
                    document.getElementById('break-time-due').innerText = time + "-minute break";
                }
                
            
            }
        }
    
        if (message.message  === 'is-break-time') {
            console.log('is break time')
            if (message.data.break_time === true) {
                document.getElementById('break-time-ongoing').style.display = 'block'
            }
        }
        if (message.message  === 'break-time-left') {
            console.log('break time left')
            let time = message.data.left;
            console.log('left ' + time)

            if (message.data.left) {
            
                document.getElementById('break-time-left').style.display = 'block'

                time = parseInt(time/60000);

                if (time == 1) {

                    document.getElementById('break-time-left').innerText = "1 min left";
                }
                else {
                    document.getElementById('break-time-left').innerText = time + " mins left";
                }
            }
        }
    })

    const start_break_button = document.getElementById('start-break');
    start_break_button.addEventListener('click', function() {
        chrome.runtime.sendMessage({message: 'start-break'})
        document.getElementById('break-time-alert').style.display = 'none'
        document.getElementById('break-time-ongoing').style.display = 'block'

    })

    const end_break_button = document.getElementById('end-break');
    end_break_button.addEventListener('click', function() {
        chrome.runtime.sendMessage({message: 'end-break'})
        document.getElementById('break-time-ongoing').style.display = 'none'

    })
}

function handleReportTrigger() {
    const el = document.getElementById('report-trigger');
    const report_container = document.getElementById('report');
    
    el.addEventListener('click', function() {
        report_container.style.display = 'block';
        if (activeSession) {
            ELEMENTS.TASK_CONTAINER.style.display = 'none'

        }
        else {
            ELEMENTS.CREATE_CONTAINER.style.display = 'none'

        }
    })
    const report_btn = document.getElementById('report-btn');
    report_btn.addEventListener('click', function() {
        report_container.style.display = 'none';

        if (activeSession) {
            ELEMENTS.TASK_CONTAINER.style.display = 'block'
            
        }
        else {
            ELEMENTS.CREATE_CONTAINER.style.display = 'block'
        }        
    })

    
}

function setUpHandlers() {
    getClosedTabs()
    tabsHandler();
    //startTime()
    //restoreTabhandler()
    handleSearch()
    getDistractionsCounter()
    setSettingsHandler()
    createSessionHandler()
    stopSessionHandler()
    expandClosedTabs()
    handleBreakTime()
   // setUpFreeTrialLeftHandler()
    handleReportTrigger();
}
document.addEventListener("DOMContentLoaded", ()=> {

    chrome.storage.sync.get(null, (settings) => {

        // see if there is any update 







        const token = settings && settings.auth && settings.auth.USER_TOKEN;


        let trial_to_end = settings && settings.credentials && settings.credentials.TRIAL_TO_END;
        let plan = settings && settings.credentials && settings.credentials.PLAN;

        if (trial_to_end && plan && plan === 'trial') {

            trial_to_end = new Date(trial_to_end).getTime()
            let now = new Date().getTime();
    
            const difference = now-trial_to_end;
            if (now - trial_to_end >= 0) {
               // document.getElementById('trial').style.display = "block"
                //let totalDays = Math.ceil(difference / (1000 * 3600 * 24));
    
                    // show the trail period shit
                document.getElementById('trial-ended').style.display = "block"
                document.getElementById('trial-ended__notif').innerHTML = "Your free trial has ended. You can upgrade your plan and click on <b>Refresh</b> to continue blocking distractions."
                
                document.getElementById('refresh-plan-status').addEventListener('click', function(e) {
                    refreshUserPlanStatus(e);
                });
    
                return
            }
    
            else {
                // show the trail period shit
                document.getElementById('trial').style.display = "block"
                //document.getElementById('plan-upgrade').style.display = "none"
                let totalDays = parseInt(Math.ceil(difference / (1000 * 3600 * 24))).toString().split('-')[1];
                document.getElementById('trial-left').innerText =  totalDays + ' days of free trial left';
            }
        }

        if (!token) {
            if (document.getElementById('latest-version').style.display === 'none') {

                setUpAuthHandler()
            }
        }
        else {
            
            chrome.runtime.sendMessage({message: "find-active-session"}, function(response) {
                
            });
            chrome.runtime.sendMessage({'message': 'popup'});
        
        
            chrome.storage.sync.get(null, (settings) => {
                const tone = settings && settings.settings &&  settings.settings.TONE || 'normal';
                const character_items = document.getElementsByClassName('settings-character');
                for (let i = 0; i<character_items.length; i++) {
                    const item = character_items[i];
                    if (item.dataset.tone === tone) {
                        item.classList.add('tone-chosen')
                    }
                    
                }
        
                const optimal_tabs = settings && settings.settings && settings.settings["OPTIMAL_TABS"] ||  7
                const input = document.getElementById('settings-optimal-tabs');
                input.value = optimal_tabs
              
            })
            //setUpFreeTrialLeftHandler();
            tabsHandler();
            getClosedTabs()
            //startTime()
            //restoreTabhandler()
            handleSearch()
            getDistractionsCounter()
            setSettingsHandler()
            createSessionHandler()
            stopSessionHandler()
            expandClosedTabs()
            handleBreakTime()
            handleReportTrigger();
        }


    



    })






   
    
})