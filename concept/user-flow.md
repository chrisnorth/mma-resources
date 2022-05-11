# User Journey

## Overall Landing page

* Intro to "mission"
* _Welcome video?_
* User selects which messenger to use
	* _Does this involve a "password" to restrict access to sections?_
* Option to calculate Hubble constant
	
## <span style="color:red">Grav Waves</span>

### Day 1 (background)
* _Welcome video?_
* Link to Google Form with intro activities
* Learning objectives

### "Day 2" (i.e. workshop):

#### <span style="color:blue">GW Task 1: Create Event Notification</span>
##### <span style="color:green">Goal</span>
Create Event Notification to transmit to other groups

##### <span style="color:green">Information required</span>

* Waveforms for 3 detectors
* Localisation maps for detectors
* Guidelines on calculating BNS probability

##### <span style="color:green">Task sequence</span>
1. Select an event from a selection, each with a specific event time
2. View waveform.
3. Estimate likelihood of BNS based on time in of waveform
4. Calculate possible locations using waveform viewer
	* User is comparing arrival time difference for detector pairs to time difference maps (c.f. https://raw.githubusercontent.com/chrisnorth/mma-resources/main/plots/GW/dt_LH.png)
	* Max 2 detectors for each event (to simplicity and to avoid over-constraint)
	* N.B. There are 3 detector-pair maps for each event (though only 2 independent), which have to be displayed. Could have toggle to switch between them
	Either:
		a. display waveforms on graph and user has to measure, then refer to maps to cells
		b. interactive slider to change time difference waveforms and establish timings, then refer to map to select cells
	* User has to either write down map locations (in text box or externally), or select the ones that match on 
	* The should identify two clusters of 1/few cells where arrival time difference match.
5. Combine **BSN likelihood** with **event time** and **possible location(s)** to produce event notification for event(s) they want to create notifications for. Either:
	a. Could create auto-complete based on selections above
	b. Could give template text that they fill in outside of browser
6. Transmit Event Notication to other teams. Either:
	a. Build in a code they can send to others (outside of web-app) so they can view Event Notification (c.f. url query, possibly encoded to include options selected) [requires auto-creation above]
		* (use e.g Hex values of cell locations to obfuscate?)
	b. Assume that "dissemination" of Event Notivitation happens outside of website? [requires ability to copy/paste]
	c. Both?
	* N.B. Dissemination of code or text happens outside the web-app to remove reliance on server-side code and collecting information from users.

#### <span style="color:blue">GW Task 2: Estimate mass and distance</span>

##### <span style="color:green">Goal</span>
Estimate mass and distance to event

##### <span style="color:green">Information required</span>

* Waveforms for single detector
* Inclination information form other groups

##### <span style="color:green">Task sequence</span>
1. User waveform simulator to simulation with data (single detector)
	* change sliders to match simulation (mass and distance) to detector
		* c.f. http://data.cardiffgravity.org/waveform-fitter/
	* _Do we include mass ratio in this calculation?_
	* _Do we include slider for inclination at this stage?_
		* _Or slider for inclination range, which can be narrowed or widened_?
3. On receipt of inclination information, modify distance estimate with narrower inclination estimate
2. Update Event Notification?
	* send new code or text to other teams?

---
## <span style="color:red">X-ray</span>

### Day 1 (background)
* _Welcome video?_
* Link to Google Form with intro activities
* Learning objectives:
	1. Types of jet models
	2. Selection of data

### "Day 2" (i.e. workshop):

#### <span style="color:blue">X-ray task 1: Estimate inclination</span>

##### <span style="color:green">Goal</span>
Estimate inclination of event and type of jet

##### <span style="color:green">Information required</span>

* Map of sky with events and timings
* Event notification from Grav Waves or Gamma Ray group
* Distance estimate
* X-ray data on events

##### <span style="color:green">Task sequence</span>
1. Select a sky map cell with events in it
	* If provided code, display event notification to identify cells
2. Select data timeframe from observations to construct x-ray light curve
3. Compare observations with models
	* Select from list of models to compare with data
4. Adjust model based on distance to event
5. If unclear, select different timeframe for more data
6. Transmit inclination estimate to

#### <span style="color:blue">X-ray task 2: Other wavelengths?</span>

##### <span style="color:green">Goal</span>
Collate other wavelengths? Radio, IR?

##### <span style="color:green">Information required</span>

TBC

##### <span style="color:green">Task sequence</span>
TBC

---
## <span style="color:red">Gamma ray</span>

### Day 1 (background)
* _Welcome video?_
* Link to Google Form with intro activities
* Learning objectives:
	1. Types of GRBs
	2. Characterisation of GRBs

### "Day 2" (i.e. workshop):

#### <span style="color:blue">Gamma-ray task 1: Create Event Notification</span>

##### <span style="color:green">Goal</span>
Identify location and estimate inclination of event and type of jet

##### <span style="color:green">Information required</span>

* List of events and timings
* sky maps for events
* Event notification from Grav Waves group
* Information on estimating inclination from distance and luminosity
* Gamma-ray data on events

##### <span style="color:green">Task sequence</span>
1. Select a sky map cell with events in it at appropriate time
2. Find gammay ray events in cell
3. Identify gamma ray events 

---
## <span style="color:red">Optical</span>

### Day 1 (background)
* _Welcome video?_
* Link to Google Form with intro activities
* Learning objectives:
	1. 
	
### "Day 2" (i.e. workshop):

#### <span style="color:blue">Optical task 1: Identify event</span>

##### <span style="color:green">Goal</span>
Identify event progenitor and redshift of Galaxy

##### <span style="color:green">Information required</span>

* Map of sky with events and times
* Event notification from Grav Waves and Gamma ray group groups
* Galaxy catalogues

##### <span style="color:green">Task sequence</span>
1. 

---
## <span style="color:red">Hubble Calculation</span>

### Day 1 (background)
* _Welcome video?_
* Link to Google Form with intro activities
* Learning objectives:
	1. Hubble calculation

### "Day 2" (i.e. workshop):

#### <span style="color:blue">csomology task 1: Calculate Hubble constant</span>

##### <span style="color:green">Goal</span>
Calculate Hubble constant

##### <span style="color:green">Information required</span>
* Distance from Grav Waves group (combined with inclination from x-ray/gamma-ray)
* Redshift from optical


##### <span style="color:green">Task sequence</span>
1. Convert units?
2. Calculate H0