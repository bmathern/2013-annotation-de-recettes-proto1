
// Recipes Class
function Recipe() {};
Recipe.prototype = {
	meta: {
		"prep-time-unit":	"min",
		"cooking-time-unit":	"min",
	},
	ingredients: [],
	preparation: [],
	add_text: function(text) {
		var last_step = this.preparation[this.preparation.length-1];
		var last_inst = last_step[last_step.length-1];
		if(last_inst && last_inst.type == "text") {
			last_inst.content += text;
		} else {
			last_step.push({type: "text", content: text});
		}
	},
	add_annotation: function(text,type,label) {
		var last_step = this.preparation[this.preparation.length-1];
		last_step.push({type: "annotation", content: text, label: label, class: type});
	},
	add_ingredient: function(text,label,qtt,unit) {
		if(this.ingredients.some(function(i) {return i.label == label;})) {
			return false;
		} else {
			var ingr = {
				qtt: 0,	unit: 'n/a',
				ingredient:	text,
				label: label
			}
			qtt?ingr.qtt=qtt:null;
			unit?ingr.unit=unit:null;
			this.ingredients.push(ingr);
			return true;
		}
	},
	stringify: function() {
		var new_recipe = {};
		new_recipe.title = this.title;
		new_recipe.meta = this.meta;
		new_recipe.ingredients = this.ingredients;
		new_recipe.preparation = this.preparation;
	//	console.log(new_recipe);
		return JSON.stringify(new_recipe)
	},
	load: function() {
/*		// remove for now... not needed?
		annotations = {};
		function add_annotation(type,label) {
			if(!annotations[type]) {
				annotations[type] = [];
			}
			annotations[type].push(label);
		}	
*/
		function parse_meta(m,parentEl) {
			var ul = DOM_Create.element('ul',parentEl);
			var m_array = [];
			m_array.push('Préparation : '+ m['prep-time'] + ' ' + m['prep-time-unit']);
			m_array.push('Cuisson : '+ m['cooking-time'] + ' ' + m['cooking-time-unit']);
			m.budget?m_array.push('Difficulté : '+m.difficulty):null;
			m.budget?m_array.push('Budget : '+m.budget):null;
			m.budget?m_array.push('Pour '+m.servings+' personnes'):null;
			if(m.comments) {
				m.comments.forEach(function(c) {
					m_array.push(c);
				});
			}
			return m_array.map(function(s) {
				var li = DOM_Create.element('li',ul);
				DOM_Create.text(li,s);
			});
		}
		function parse_ingredients(i_list,parentEl) {
			var ul = DOM_Create.element('ul',parentEl);
			return i_list.map( function(i) {	
				var li = DOM_Create.element('li',ul);
				var i_string = '';
				if(i.qtt != 0) {
					DOM_Create.element('span',li,{class: 'quantity',content: i.qtt});
					DOM_Create.text(li,' ');
					if(i.unit != 'n/a') {
						DOM_Create.element('span',li,{class: 'unit',content: i.unit});
						DOM_Create.text(li,' de ');
					}
				}
				DOM_Create.element('span',li,{class: 'ingredient '+i.label,content: i.ingredient});
				add_annotation('ingredient',i.label);
				// i.comments
			});
		}
		function parse_prep(p_list,parentEl) {
			var ol = DOM_Create.element('ol',parentEl);
			// TODO: sort annotations
			p_list.forEach(function(p) {
				var li = DOM_Create.element('li',ol);
				p.forEach(function(item) {
					if(item.type == 'annotation') {
						DOM_Create.element('span',li,{content: item.content, class: item.class + ' ' + item.label});
						add_annotation(item.class,item.label);
					} else {
						DOM_Create.text(li,item.content);
					}
				});
			});
		}

		var recipe_div = document.getElementById('recipe');
		DOM_Create.element('h2',recipe_div,{content: recipe.title});

		var col1 = DOM_Create.element('div',recipe_div,{class: 'colonne'});
		parse_meta(recipe.meta,col1);
		DOM_Create.element('h3',col1,{content: 'Ingrédients'});
		parse_ingredients(recipe.ingredients,col1);

		var col2 = DOM_Create.element('div',recipe_div,{class: 'colonne'});
		DOM_Create.element('h3',col2,{content: 'Préparation'});
		parse_prep(recipe.preparation,col2);
	
//		return annotations;
	}
}


// DOM_Create
var DOM_Create = {
	text: function(parentEl,text) {
		var el = document.createTextNode(text);
		parentEl.appendChild(el);
		return el;
	},
	element: function(tagName,parentEl,opt) {
		var el = document.createElement(tagName);
		if(opt) {
			if(opt.el) {
				el.appendChild(opt.el);
			} else {
				opt.id?el.setAttribute('id',opt.id):null;
				opt.class?el.setAttribute('class',opt.class):null;
				var text = document.createTextNode(opt.content || '');
				el.appendChild(text);
			}
		}
		parentEl.appendChild(el);
		return el;
	}
};



// RecipeUI
function RecipeUI() {
	this.recipe = new Recipe();
	this.current_step = this.on_event_add_step();
	this.build_concepts();

	this.typeahead_init();

	// INIT THE EVENT LISTENERS
	$("#recipe_form").on('submit',this.prevent_default.bind(this));
	$("#prep").on('keypress',this.on_event_key.bind(this));
	$("#qtt_input").on('keypress',this.on_event_space.bind(this));
	$("#unit_input").on('keypress',this.on_event_space.bind(this));
//	document.getElementById("prep").addEventListener('typeahead:autocompleted',add_annotation);
//	document.getElementById("prep").addEventListener('typeahead:selected',add_annotation);
	$("#prep").on('typeahead:autocompleted',this.on_event_add_annotation.bind(this));
	$("#prep").on('typeahead:selected',this.on_event_add_annotation.bind(this));
	$("#add_step").on('click',this.on_event_add_step.bind(this));
	$("#add_ingredient").on('click',this.on_event_add_ingredient.bind(this));
	$("#ingredient_input").on('submit',this.on_event_add_ingredient.bind(this));
	$("#ingredient_input").on('typeahead:autocompleted',this.on_event_add_ingredient.bind(this));
	$("#ingredient_input").on('typeahead:selected',this.on_event_add_ingredient.bind(this));
	$("#save").on('click',this.on_event_save.bind(this));

	function makeToggleClass(addClass) {
		var concepts = this.concepts;
		var method = addClass?"addClass":"removeClass";
		return function(e) {
			// Pour chaque ingrédient de la liste, on regarde si
			// l'ingrédient survolé correspond à cet ingrédient
			concepts['ingredients'].forEach(function(ing) {
				if( $(this).hasClass(ing) ) {
					$('.'+ing)[method]('ingredient-hover');
				}
			},this);
			return false;
		}
	}

	// Utilisation de jQuery pour écouter l'événement "mouseenter"
	// sur les balises qui possèdent la classe "ingredient"
	$('.ingredient').on('mouseenter',makeToggleClass(true));
	$('.ingredient').on('mouseleave',makeToggleClass(false));

};


RecipeUI.prototype = {

	build_concepts: function() {
		this.concepts = {};
		this.concepts.words = [
			"Ajoutez","Mélangez","laissez reposer"
			];
		this.concepts.ustensiles = [
			{value: "moule", tokens: ["moule"], label: "moule", class: "ustensile"},
			{value: "four", tokens: ["four"], label: "four", class: "ustensile"},
		];
		this.concepts.ingredients = [
			{value: "sel", tokens: ["sel"], label: "sel", class: "ingredient"},
			{value: "sucre", tokens: ["sucre"], label: "sucre", class: "ingredient"},
			{value: "poires", tokens: ["poires"], label: "poires", class: "ingredient"},
			{value: "chocolat", tokens: ["chocolat"], label: "chocolat", class: "ingredient"},
			{value: "œufs", tokens: ["œufs", "oeufs"], label: "oeufs", class: "ingredient"},
			{value: "lait", tokens: ["lait"], label: "lait", class: "ingredient"},
			{value: "crème fraîche", tokens: ["crème fraîche"], label: "crème-fraîche", class: "ingredient"},
		];
	},

	add_ingredient: function(text,label,qtt,unit) {
		if(this.recipe.add_ingredient(text,label,qtt,unit)) {
			var li = DOM_Create.element('li',document.getElementById('ingredient-list'));
			if(qtt && qtt != 0) {
				DOM_Create.element('span',li,{class: 'quantity',content: qtt});
				DOM_Create.text(li,' ');
				if(unit && unit != 'n/a') {
					DOM_Create.element('span',li,{class: 'unit',content: unit});
					DOM_Create.text(li,' de ');
				}
			}
			DOM_Create.element('span',li,{class: 'ingredient '+label,content: text});
		}
	},
	add_text: function(text) {
		var text_node = document.createTextNode(text);
		this.current_step.appendChild(text_node);
		this.recipe.add_text(text);
	},
	get_meta: function() {
		this.recipe.title = $("#title").val();
		this.recipe.meta['prep-time'] = $("#prep-time").val();
		this.recipe.meta['cooking-time'] = $("#cooking-time").val();
		this.recipe.meta.budget = $("#budget").val();	
		this.recipe.meta.difficulty = $("#difficulty").val();	
		this.recipe.meta.servings = $("#servings").val();
	},

	// event related functions
	prevent_default: function(e) {
		e.preventDefault;
		return false;
	},
	on_event_save: function(e) {
		this.get_meta();
		
		// from http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
		var a = window.document.createElement('a');
		a.href = window.URL.createObjectURL(new Blob([this.recipe.stringify()], {type: 'text/json'}));
		a.download = recipe.title==undefined?'recipe.json':this.recipe.title+'.json';
		// Append anchor to body.
		document.body.appendChild(a);
		a.click();
		// Remove anchor from body
		document.body.removeChild(a);

	},
	on_event_add_ingredient: function(e,d) {
		var qtt = $("#qtt_input").val();
		qtt = qtt==''?undefined:qtt;
		var unit = $("#unit_input").val();
		unit = unit==''?undefined:unit;
		var label, text;
		if(d) {
			text = d.value;
			label = d.label;
		} else {
			text = $("#ingredient_input").val();
			label = text;
			this.concepts.ingredients.push({value: text, tokens: [text], label: text, class: "ingredient"});
			this.typeahead_reinit();			
		}
		this.add_ingredient(text,label,qtt,unit);
		$("#qtt_input").val('');
		$("#unit_input").val('');
		$("#ingredient_input").val('');
		$("#qtt_input").focus();
		e.preventDefault;
		return false;
	},
	on_event_add_annotation: function(e,d) {
		if(!d.class) {
			this.add_text(d.value+' ');
		} else {
			DOM_Create.element('span',this.current_step,{content: d.value, class: d.class + ' '+ d.label});
			this.recipe.add_annotation(d.value,d.class,d.label);
			if(d.class == 'ingredient') {
				this.add_ingredient(d.value,d.label);
			}
			this.add_text(' ');
		}
		e.target.value = "";
		e.preventDefault;
		return false;
	},
	parse_key_event: function(e) {
		this.add_text(e.target.value + String.fromCharCode(e.which));
		e.target.value = "";
		e.preventDefault;
	},
	on_event_key: function(e) {
		switch(e.which) {
			case 13: // return
				this.add_text(e.target.value);
				e.target.value = "";
				current_step = this.on_event_add_step();
				e.preventDefault;
				return false;
			case 32: // space
				this.parse_key_event(e)
				return false;
			case 46: // .
				this.parse_key_event(e)
				return false;
			case 44: // ,
				this.parse_key_event(e)
				return false;
			case 58: // :
				this.parse_key_event(e)
				return false;
			case 59: // ;
				this.parse_key_event(e)
				return false;
			case 33: // !
				this.parse_key_event(e)
				return false;
			case 63: // ?
				this.parse_key_event(e)
				return false;
			default:
//				console.log(e.which);
		}
	},
	on_event_space: function(e) {
		if(e.which == 32) { // space
			if(e.target.id == "qtt_input") {
				$("#unit_input").focus();
			} else {
				$("#ingredient_input").focus();
			}
			return false;
		}
	},
	on_event_add_step: function() {
		var li = document.createElement('li');
		document.getElementById("steps").appendChild(li);
		this.recipe.preparation.push([]);
		return li;
	},

	// TYPEAHEAD.JS
	typeahead_init: function() {
		$("#ingredient_input").typeahead({
			//name: 'ingredients', // caching prevents updating when new elements added
			local: this.concepts.ingredients,
			template: '<p class="{{class}}-hover"><strong>{{value}}</strong> ({{class}})</p>',
			engine: Hogan
		});

		$("input#prep").typeahead([{
			//name: 'ingredients', // caching prevents updating when new elements added
			local: this.concepts.ingredients,
			template: '<p class="{{class}}-hover"><strong>{{value}}</strong> ({{class}})</p>',
			engine: Hogan
		},{
			//name: 'ustensiles', // caching prevents updating when new elements added
			local: this.concepts.ustensiles,
			template: '<p class="{{class}}-hover"><strong>{{value}}</strong> ({{class}})</p>',
			engine: Hogan
		},{
			//name: 'words', // caching prevents updating when new elements added
			local: this.concepts.words,
			template: '<p>{{value}}</p>',
			engine: Hogan
		}]);
	},
	typeahead_reinit: function() {
		$("#ingredient_input").typeahead('destroy');
		$("input#prep").typeahead('destroy');
		this.typeahead_init();
	},
};


function init() {
	new RecipeUI();
	$("#title").click(function(e) {console.log(e);});
}

$(window).load(init);




