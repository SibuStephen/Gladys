/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

var request = require('request');
var eventsGithub = 'https://raw.githubusercontent.com/GladysProject/gladys-events/master/events.en.json';

/**
 * Add events if not exist in the database
 */
function addEvent(event, cb){
	EventType.findOne({name:event.name}, function(err, eventtype){
		if(err) return cb(err);
		
		if(!eventtype){
			EventType.create(event, function(err, event){
				if(err) return cb(err);
				
				sails.log.info('[Gladys Update] New event created - ' + event.name);
				cb(null, event);
			});
		}else{
			cb(null);
		}
	});		 
}

/**
 * Get the Events from GitHub 
 * (see : https://github.com/GladysProject/gladys-events )
 */
function getEventsGithub(cb){
	request(eventsGithub, function(err, response, body) {
				if(err) return cb('GetEventsGithub : Fail to load URL : ' + err);
				try{
					var events = JSON.parse(body);
					cb(null, events);
				}catch(e){
					cb(e);
				}
	});
}

module.exports = {
	/**
	 * Description
	 * @method saveEvent
	 * @param {} eventType
	 * @param {} userId
	 * @param {} param
	 * @param {} callback
	 * @return 
	 */
	saveEvent: function(event, cb){
		cb =  cb || function() {};
		
		EventType.findOne({name: event.eventtype}).exec(function(err, eventtype) {
			if(err) return cb(err); 

			if(eventtype){
				event.eventtype = eventtype.id;
				LifeEvent.create(event, function(err, lifeevent){
					if(err) return cb(err);
					
					ScenarioService.launcher(eventtype.name, event.param, function (){});
					cb(null, lifeevent);
				});
		 	}else{
		 		cb('eventType ' + event.eventtype + ' not found');
		 	}
		});
	},
	
	/**
	 * Sync events with GitHub
	 */
	syncEvents: function() {
		sails.log.info('[Gladys Update] Updating life event lists from Github...');
		getEventsGithub(function(err, events){
			if(err) return sails.log.warn('LifeEventService : syncEvents' + err);
			
			async.each(events, addEvent, function(){
				sails.log.info('[Gladys Update] Life event lists updated !');
			});
		});
	}
};
