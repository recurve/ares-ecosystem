// Copyright $YEAR, $ORGANIZATION
// All rights reserved.
enyo.kind({
	name: "$NAME",
	kind: "Control",
	published: {
		/*
			Aaron - define a property here like "person"
			You will then have "this.getPerson()" and "this.setPerson()" for free.
			You can also implement "personChanged: function(oldValue)" which 
			gets called automatically every time the value is changed.
		*/
	},
	/*		
	bindings: {
		https://enyojs.com/docs/2.4.0/building-apps/managing-data/building-data-driven-apps.html
		Aaron - this allows two-way data bindings.
		It does not make sense to implement in your kind and in fact will cause errors if you do.
		You only want to use it from a "parent" component to create a bi-directional mapping in a child.
		Wanted to make you aware this functionality exists. 
	},
	*/
	statics: {
		/*
			Aaron - these are "class" properties that are accessed like global variables
		*/
	},
	handlers: {
		/*
			Aaron - Events that this component listens to. 
			Could also originate from a child component but be intercepted here.
			When you intercept return "true" to prevent further bubbling up the DOM. 
		*/
	},
	events: {
		/*
			Aaron - Events that this component produces.
			Always say "on" such as "onComplete"
			You will get "doComplete()" for free which you should pass a data structure.
			"doComplete({message: 'contact added'})" would then be later accessed 
			from a handler like so "alert(event.message)"
		*/
	},
	components: [
		/*
			Aaron - your child components go here.
			Remember, if necessary, you can use data bindings.
			Ares - the Visual IDE written in Enyo - has good use of data bindings.
		*/
	],
	create: function() {
		this.inherited(arguments);
		// initialization code goes here
	}
});
