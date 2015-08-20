(function($, doc, win){
	
	var self           = null;	
	var currentStep    = null;	
	var defaults = {
			startAt: null,
			contentMapping: null
	};
	
	Steps.prototype.forward = function(){
		currentStep.callNext();
	};
	
	Steps.prototype.back = function(){
		currentStep.callPrevious();
	};
	
	function Step(stepOptions, HTMLNode){
		
		var step = this;
		
		var TODO_STYLE    = 'steptracker-todo';
		var DONE_STYLE    = 'steptracker-done';
		var CURRENT_STYLE = 'steptracker-current';
		
		var defaults = {
				visible: false,
				loaded: false,
				HTMLNode: null,
				contaniner: null,
				content: null,
				id: null,
				onRender: function(){
					step.setVisible();
				}
		};
		
		this.options = $.extend(defaults, stepOptions);	
		
		this.options.HTMLNode = HTMLNode;
		$(step).on('rendered', step.options.onRender);
		
		HTMLNode.attr('id', this.options.id);
		HTMLNode.attr('class', TODO_STYLE);
		
		/**
		 * Sets the step visible in the "time line", hidding everything else.
		 */
		this.setVisible = function(){

			// Se ocultan todos hacia atras con respecto a la etapa actual
			var current = step.prev;
			while(current){				
				current.hide();
				current = current.prev;
			}

			// Se ocultan todos hacia adelante con respecto a la etapa actual
			current = step.next;
			while(current){				
				current.hide();
				current = current.next;
			}
			
			// Se muestra el actual
			step.getContainer().show();
			step.setState('DONE');		
			step.options.visible = true;
			
			step.setState('CURRENT');
			
			// Se actualiza el paso actual con el que se está dejando activo
			currentStep = step;
			
		};
		
		this.hide = function(){
			step.options.visible = false;
			step.getContainer().hide();
			$(step.options.HTMLNode).removeClass(CURRENT_STYLE);
		};
		
		/**
		 * Despliega por pantalla el contenido definido para la etapa
		 */
		this.render = function(){
			// Solo se va a buscar el contenido de la etapa si es que este aun no ha sido cargado
			if(step.isLoaded()){ 
				$(step).trigger('rendered');
				return; 
			}
			return $.ajax({
				method: "GET",
				url: step.options.content,
				success: function(data){
					var stepContainer = $('<div></div>').attr('id', step.options.id + 'Content').append(data);
					step.options.container = $(stepContainer.get(0));
					$('#stepsContentContainer').append(stepContainer);
					step.setLoaded(true);
					$(step).trigger('rendered');
				}
			});
		};
		
		this.setState = function(state){
			switch (state) {
		    case "DONE":
		    	$(step.options.HTMLNode).removeClass(TODO_STYLE);
				$(step.options.HTMLNode).addClass(DONE_STYLE);
		        break;
		    case "CURRENT":
		    	$(step.options.HTMLNode).addClass(CURRENT_STYLE);
		    	break;
			};
		};
		
		this.getContainer = function(){
			return $(this.options.container);
		};
		
		this.isVisible = function(){
			return step.options.visible;
		};
		
		this.isLoaded = function(){
			return step.options.loaded;
		};
		
		this.setLoaded = function(loaded){
			step.options.loaded = loaded;
		};
		
		this.callNext = function(){
			if(this.next){
				this.next.render();
			}
		};
		
		this.callPrevious = function(){
			if(this.prev){
				this.prev.render();
			}			
		};
		
	}
	
	function Steps(containerElement, options){
		self = this;
		self.containerElement = $(containerElement);
		self.options = $.extend(defaults, options);
		init();
	}
	
	/**
	 * Precarga los contenidos de las etapas hasta una etapa en particular
	 * @finalStep Etapa hasta donde se necesita precargar los contenidos
	 */
	function preloadSteps(finalStep){
		
		var lastStep = null;		
		var buffer = [];		
		
		// Se cargan los contenidos de todas las etapas hasta la etapa indicada
		$.each(self.options.contentMapping, function(index, step){
			
			// Se almacenan las llamadas ajax a los contenidos
			buffer.push(step.render());				
			
			// Por defecto no se marcan como visibles
			step.options.visible = false;
			$(step.getContainer()).hide();	
			
			// Se marcan como realizados
			step.setState('DONE');
			
			// Se almacena la última etapa
			if(finalStep == step.options.id){
				lastStep = step; 
				currentStep = lastStep;
				return false;
			}
			
		});
		
		// Cuando se terminan de cargar los contendios se muestra la útlima
		$.when.apply($, buffer).done(function(){			
			lastStep.setVisible(); //updateVisibility(lastStep);
		});
		
	}
	
	function init(){
		
		var previousStep = null;
		
		$.each(self.options.contentMapping, function(index, element){
						
			self.options.contentMapping[index] = new Step(element, $(self.containerElement.children()[index]));
			element = self.options.contentMapping[index];

			if(previousStep){
				previousStep.next = element;
				element.prev = previousStep;
			}
			
			previousStep = element;
			
			$(element.options.HTMLNode).click(function(){
				
				// Se activan solo las etapas que ya se hayan cargado o las que esten a continuación
				// de una ya cargada
				if(element.isLoaded() || element.prev.isLoaded()){
					currentStep = element;
					if(!currentStep.isLoaded()){
						currentStep.render();
					}
					currentStep.setVisible();
				}
				
			});			
			
						
		});
		
		if(self.options.startAt){
			preloadSteps(self.options.startAt);
		}
		
	}
	
	/**
	 * TODO:
	 * 1.- que aplique solo para elemento <ol>
	 */
	$.fn.steps = function(options){
		return new Steps(this, options);
	};
		
})(jQuery, document, window);
