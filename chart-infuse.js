window.addEventListener('DOMContentLoaded', function() {
    const focusVsDistractionChart = document.getElementById('focusVsDistractionChart');
    

    chrome.runtime.sendMessage({message: "weekly-stats"}, (response)=> {
        const date = new Date();
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate()
        const date_string = `${year}-${month}-${day}`


        const result = response;

        




        const today_distraction_time =  result[date_string].total_distraction_time;
        const today_task_time = result[date_string].total_task_time;

        const today_real_task_time = today_task_time - today_distraction_time;

        const perc_today_distraction_time = parseFloat((today_distraction_time/today_task_time) * 100).toFixed(2)
        const perc_today_real_task_time = parseFloat((today_real_task_time/today_task_time) * 100).toFixed(2)


        const today_distractions_detected = result[date_string].distractions_detected
        const today_distractions_ignored = result[date_string].distractions_ignored 
        const today_distractions_closed = result[date_string].distractions_closed 
        
        let week_distraction_time, week_task_time = 0;

        const distraction_time_by_day = {
            "Sun": 0,
            "Mon": 0,
            "Tue": 0,
            "Wed": 0,
            "Thu": 0,
            "Fri": 0,
            "Sat": 0
        }
        const task_time_by_day = {
            "Sun": 0,
            "Mon": 0,
            "Tue": 0,
            "Wed": 0,
            "Thu": 0,
            "Fri": 0,
            "Sat": 0
        }


        try {

            let total_distraction_percentage = 0;
            Object.keys(result).forEach((day)=> {
                const extracted_day = new Date(day) && new Date(day).toString().split(' ')[0];
                const distraction_value = result[day].total_distraction_time;
                const task_value =  result[day].total_task_time- result[day].total_distraction_time
                const total_task_value =  result[day].total_task_time;
                
                const distraction_percentage = parseFloat((distraction_value / total_task_value) * 100).toFixed(2)
                const task_percentage = parseFloat((task_value / total_task_value) * 100).toFixed(2)

                
                distraction_time_by_day[extracted_day] = distraction_percentage

                total_distraction_percentage +=  distraction_percentage;
                
                task_time_by_day[extracted_day] = task_percentage
            })

            let grade = null;
            if (total_distraction_percentage) {
                this.document.getElementById('stats-grade-polygon').style.display = "block";

               // total_distraction_percentage = parseFloat(total_distraction_percentage / 7).toFixed(2);
            }

            
            else if (total_distraction_percentage <= 5) {

                grade = 'A'
                this.document.getElementById('stats-grade-polygon').style.fill = "#4ECB71";
                this.document.getElementById('stats-grade-indicator').innerText = grade;
                this.document.getElementById('stats-grade-text').innerText = "You're a jedi!";

            } 
            else if (total_distraction_percentage <= 10) {
                
                grade = 'B'
                this.document.getElementById('stats-grade-polygon').style.fill = "gold";
                this.document.getElementById('stats-grade-indicator').innerText = grade
                this.document.getElementById('stats-grade-indicator').style.color = "black"
                this.document.getElementById('stats-grade-text').innerText = "Good job! You're on the right track to becoming a productivity jedi.";

            }
            else if (total_distraction_percentage <= 25) {
                grade = 'C'
                this.document.getElementById('stats-grade-polygon').style.fill = "orange";
                this.document.getElementById('stats-grade-indicator').innerText = grade
                this.document.getElementById('stats-grade-indicator').style.color = "black"

                this.document.getElementById('stats-grade-text').innerText = "Keep working on reducing distractions.";


            }
            else if (total_distraction_percentage <= 30){
                grade = "D"
                this.document.getElementById('stats-grade-polygon').style.fill = "yellow";
                this.document.getElementById('stats-grade-indicator').innerText = grade
                this.document.getElementById('stats-grade-indicator').style.color = "black"
                this.document.getElementById('stats-grade-text').innerText = "There's room for improvement. Try to focus more on your tasks and reduce distractions.";


            }
            else  {
                grade = "F"
                this.document.getElementById('stats-grade-polygon').style.fill = "red";
                this.document.getElementById('stats-grade-indicator').innerText = grade
                this.document.getElementById('stats-grade-text').innerText = "Hell no. Let's work on this.";
            }




 

            

        

        }catch(e) {
            throw e
        }
    
        

    
    
    
    
    
    
        new Chart(focusVsDistractionChart, {
            
            type: 'doughnut',
            data: {
                labels: ["Task",	"Distraction"],
                datasets: [{
                    label: '% Your Task vs Distraction Focus Rate',
                    data: [perc_today_real_task_time || 0, perc_today_distraction_time || 0],
                    borderWidth: 1,
                    borderColor: ['#4ECB71', '#A90F3D'], // Add custom color border 
                    backgroundColor: ['#4ECB71',  '#A90F3D',],
                }],
                
        
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                      display: false
                    }
                },
                tooltips: {
                    callbacks: {
                       label: function(tooltipItem) {
                              return tooltipItem.yLabel;
                       }
                    }
                }
                
            },
            
        });


        const distractionBlockRate = document.getElementById('distractionBlockRateChart');
        
        new Chart(distractionBlockRate, {
            type: 'doughnut',
            data: {
                labels: ["Distraction Closed",	"Distraction Ignored"],
                datasets: [{
                    label: 'Your Task vs Distraction Focus Rate',
                    data: [today_distractions_closed, today_distractions_ignored],
                    borderWidth: 1,
                    borderColor: ['#4ECB71', '#A90F3D'], // Add custom color border 
                    backgroundColor: ['#4ECB71',  '#A90F3D',],
                }],
                
        
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                      display: false
                    }
                },
                tooltips: {
                    callbacks: {
                       label: function(tooltipItem) {
                              return tooltipItem.yLabel;
                       }
                    }
                }
                
            },
            
        });


        const weeklyDistractionTask = document.getElementById('weeklyDistractionTaskChart')

        new Chart(weeklyDistractionTask, {
            type: 'bar',
            data: {
                labels: [...Object.keys(distraction_time_by_day)],
                datasets: [{

                    label: "Distractions",
                    backgroundColor: "#A90F3D",
                    borderColor: "#A90F3D",
                    borderWidth: 1,
                    data: [...Object.values(distraction_time_by_day)]



                   
                }, {

                    label: "Tasks",
                    backgroundColor: "#4ECB71",
                    borderColor: "#4ECB71",
                    borderWidth: 1,
                    data: [...Object.values(task_time_by_day)]
                
                }],
                
        
            },
            options: {
                responsive: true,
                legend: {
                  position: "top"
                },
                title: {
                  display: true,
                  text: "Chart.js Bar Chart"
                },
                scales: {
                  yAxes: [{
                    ticks: {
                      beginAtZero: true
                    }
                  }]
                }
                
            },
            
        });
    })

   
})

