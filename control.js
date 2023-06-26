chrome.runtime.onMessage.addListener((message)=> {
    alert('a')
   

        try {
        
            const CONTROL_ELEMENT = document.getElementById('focustug-control')
            const TASK_TEXTAREA_ELEMENT = document.getElementById('focustug-task-textarea')
            const INTENSITY_ELEMENTS = document.getElementsByClassName('focustug-control-section__intensity');
            let DEFAULT_WORK_TIMES  = ['60', '45', '30', '25', '20', '15', '10', '5']
            let DEFAULT_BREAK_TIMES  = ['60', '45', '30', '25', '20', '15', '10', '5'];
            
            let sampleTaskPlaceHolders = ["Conduct market research to identify potential target markets and evaluate demand for a new service offering"]
            
            
            
            let chosenWorkTime = '60';
            let chosenBreakTime = '15';
            
            
            
            const task = TASK_TEXTAREA_ELEMENT && TASK_TEXTAREA_ELEMENT.value;
            alert(task)
            // choose intensity
            for (let el of INTENSITY_ELEMENTS) {
                el.addEventListener('click', function(e){
                    alert(e)
                    for (let element of INTENSITY_ELEMENTS) {
                        element.classList.remove('focustug-intensity-chosen')
                    }
                    e.currentTarget.classList.add('focustug-intensity-chosen')
                })
            }
            
            
            // timer
            if (chosenBreakTime === '60') {
                
            }
            
            
            
            
            
            
            
            
            
            
            
            
            
            const lead = document.getElementsByClassName('foctug-popup__lead')[0];
            const container = document.getElementsByClassName('foctug-popup')[0];
            const popup_items = document.getElementsByClassName('foctug-popup__item')
            if (lead) {
                lead.addEventListener('mouseover', function() {
                    // tray;
                    const tray = document.getElementsByClassName('foctug-popup__tray')[0];
                    tray.style.height = 'auto';
            
                    for (let item of popup_items) {
            
                      
                            item.style.height= '50px';
                        
                    }
                })
                container.addEventListener('mouseleave', function() {
                    // tray;
                    const tray = document.getElementsByClassName('foctug-popup__tray')[0];
                    tray.style.height = '0';
                    for (let item of popup_items) {
                      
                        item.style.height= '0';
            
                    }
                })
        }
        
        
            
        }catch(e) {
            alert(e)
        }
    

})

 
 
  
 
  