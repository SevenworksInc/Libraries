/*****************************************************
 *
 *	@Author			Jesther Bas
 *	@Company		ViiWorks Inc.
 *	@Website		www.viiworks.com
 *	@DateCreated	June 8,2016
 *	@Description	ViiHive widget script loader
 *	
 ****************************************************/

(function(window){
    //I recommend this
    'use strict';
	var Library = {};
	function define_library(){
		var name = "Timmy";
		Library.greet = function(){
			alert("Hello from the " + name + " library.");
		}
		return Library;
	}
    //define globally if it doesn't already exist
    if(typeof(Library) === 'undefined'){
        window.Library = define_Library();
    }
    else{
        console.log("Library already defined.");
    }
})(window);
