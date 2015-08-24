/*!
 * jQuery progress tracker generation plugin
 * Author: Oscar Romero  
 */
;(function($, doc, win){
	
	this.self        = null;	
	this.defaults    = {
			startAt: null,
			stepsDef: null
	};
	
	Steps.prototype.forward = function(content){
		Step.prototype.getCurrentStep().callNext(content);
	};
	
	Steps.prototype.back = function(){
		Step.prototype.getCurrentStep().callPrevious();
	};
	
	// Represents a Step
	function Step(stepOptions){
		
		var thisStep = this;
		
		// Custom styles for the different states
		var TODO_STYLE    = 'steptracker-todo';
		var DONE_STYLE    = 'steptracker-done';
		var CURRENT_STYLE = 'steptracker-current';
		
		// Options to be used as default
		var defaults = {
				visible: false,
				loaded: false,
				HTMLElement: null,
				contaniner: null,
				content: null,
				id: null,
				active: false,
				onRender: function(){
					thisStep.setVisible();
				}
		};
		
		// All created steps act like a double linked list for easy traversing.		
		if(this.last){
			this.last.next = this;
			this.prev = this.last;
		}
		 
		Step.prototype.last = this;
		
		// Step options are generated with both default and custom definitions
		this.options = $.extend(defaults, stepOptions);
		
		// The <li> HTML element is created for this Step
		this.options.HTMLElement = $('<li></li>').attr('id', this.options.id).attr('class', TODO_STYLE).append(this.options.title);
		// The <div> HTML element that will hold the content for this step is also created
		this.options.container =  $('<div></div>').attr('id', this.options.id + 'Content');
		
		// This is pretty self explanatory
		$(thisStep).on('rendered', thisStep.options.onRender);
		
		$(thisStep.options.HTMLElement).click(function(){
			
			if(thisStep.isLoaded() || thisStep.prev.isLoaded()){
				if(!thisStep.isLoaded()){
					thisStep.render();
				}
				thisStep.setVisible();
			}
			
		});		
		
		var buffer = [];
		
		// If the step is marked to be the current one activated, the all steps before are marked as done
		if(this.options.active){
			
			var previousStep = this.prev;			
			
			while(previousStep){
				
				buffer.push(previousStep.render());
				
				previousStep.options.visible = false;
				
				$(previousStep.getContainer()).hide();
				
				previousStep.setState('DONE');
				previousStep = previousStep.prev;
				
			}
			
			// The current step is rendered once all the previous ones are ready	
			$.when.apply($, buffer).done(function(){
				thisStep.render();
			});
			
		}
		
		// Sets the step as the current one selected
		this.setVisible = function(){

			// All steps before this one are hidden
			var current = thisStep.prev;
			while(current){				
				current.hide();
				current = current.prev;
			}

			// All steps after this one are also hidden
			current = thisStep.next;
			while(current){				
				current.hide();
				current = current.next;
			}
			
			// The Step is shown
			thisStep.getContainer().show();
			thisStep.setState('DONE');		
			thisStep.options.visible = true;
			thisStep.setState('CURRENT');
			
			// Se actualiza el paso actual con el que se está dejando activo
			Step.prototype.currentStep = thisStep;
			
		};
		
		this.hide = function(){
			thisStep.options.visible = false;
			thisStep.getContainer().hide();
			$(thisStep.options.HTMLElement).removeClass(CURRENT_STYLE);
		};
		
		/**
		 * Despliega por pantalla el contenido definido para la etapa
		 */
		this.render = function(content){

			// Solo se va a buscar el contenido de la etapa si es que este aun no ha sido cargado
			if(thisStep.isLoaded()){ 
				$(thisStep).trigger('rendered');
			}else if(thisStep.options.content){
				return $.ajax({
					method: "GET",
					url: thisStep.options.content,
					success: function(data){
						doRender(data);
					}
				});
			}else if(content){
				doRender(content);
			}
			
			function doRender(data){
				thisStep.options.container.append(data);
				thisStep.options.contentTarget.append(thisStep.options.container);
				thisStep.options.loaded = true;
				$(thisStep).trigger('rendered');
			}
			
			return;
			
		};
		
		this.setState = function(state){
			switch (state) {
		    case "DONE":
		    	$(thisStep.options.HTMLElement).removeClass(TODO_STYLE);
				$(thisStep.options.HTMLElement).addClass(DONE_STYLE);
		        break;
		    case "CURRENT":
		    	$(thisStep.options.HTMLElement).addClass(CURRENT_STYLE);
		    	break;
			};
		};
		
		this.getContainer = function(){
			return $(this.options.container);
		};
		
		this.isLoaded = function(){
			return thisStep.options.loaded;
		};
		
		this.callNext = function(content){
			if(this.next){
				this.next.render(content);
			}
		};
		
		this.callPrevious = function(){
			if(this.prev){
				this.prev.render();
			}			
		};
		
		Step.prototype.getCurrentStep = function(){
			return Step.prototype.currentStep;
		};
		
	}
	
	function Steps(containerElement, options){
		self = this;
		self.containerElement = $(containerElement);
		self.options = $.extend(defaults, options);
		init();
	}	
	
	function init(){
		
		$.each(self.options.stepsDef, function(index, stepDef){
			
			if(self.options.showContentAt){
				stepDef.contentTarget = self.options.showContentAt;
			}
			
			self.containerElement.append(new Step(stepDef).options.HTMLElement);
			
		});
		
	}
	
	/**
	 * TODO:
	 * 1.- que aplique solo para elemento <ol>
	 */
	$.fn.steps = function(options){
		return new Steps(this, options);
	};
		
})(jQuery, document, window);
