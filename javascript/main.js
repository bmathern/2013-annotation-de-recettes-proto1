
var recipe;

function load_recipe(recipe) {
	annotations = {};
	function add_annotation(type,label) {
		if(!annotations[type]) {
			annotations[type] = [];
		}
		annotations[type].push(label);
	}	
	function make_text_element(parentEl,text) {
		var el = document.createTextNode(text);
		parentEl.appendChild(el);
		return el;
	}
	function make_element(tagName,parentEl,opt) {
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

	function parse_meta(m,parentEl) {
		var ul = make_element('ul',parentEl);
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
			var li = make_element('li',ul);
			make_text_element(li,s);
		});
	}
	function parse_ingredients(i_list,parentEl) {
		var ul = make_element('ul',parentEl);
		return i_list.map( function(i) {	
			var li = make_element('li',ul);
			var i_string = '';
			if(i.qtt != 0) {
				make_element('span',li,{class: 'quantity',content: i.qtt});
				make_text_element(li,' ');
				if(i.unit != 'n/a') {
					make_element('span',li,{class: 'unit',content: i.unit});
					make_text_element(li,' de ');
				}
			}
			make_element('span',li,{class: 'ingredient '+i.label,content: i.ingredient});
			add_annotation('ingredient',i.label);
			// i.comments
		});
	}
	function parse_prep(p_list,parentEl) {
		var ol = make_element('ol',parentEl);
		// TODO: sort annotations
		p_list.forEach(function(p) {
			var li = make_element('li',ol);
			p.forEach(function(item) {
				if(item.type == 'annotation') {
					make_element('span',li,{content: item.content, class: item.class + ' ' + item.label});
					add_annotation(item.class,item.label);
				} else {
					make_text_element(li,item.content);
				}
			});
		});
	}

	var recipe_div = document.getElementById('recipe');
	make_element('h2',recipe_div,{content: recipe.title});

	var col1 = make_element('div',recipe_div,{class: 'colonne'});
	parse_meta(recipe.meta,col1);
	make_element('h3',col1,{content: 'Ingrédients'});
	parse_ingredients(recipe.ingredients,col1);

	var col2 = make_element('div',recipe_div,{class: 'colonne'});
	make_element('h3',col2,{content: 'Préparation'});
	parse_prep(recipe.preparation,col2);
	
	return annotations;
}


function load_file(e) {

	files = e.target.files;
	var title_el,content_el;
	for( var i=0, file; file = files[i]; i++) {
		var reader = new FileReader();
		reader.onload = function(e) {
			recipe = JSON.parse(e.target.result);
			$('#recipe').empty();
			on_file_loaded();
		};
		reader.readAsText(file);		
	}
}

function on_file_loaded() {
	var annotations = load_recipe(recipe);

	/*
     * Dans le HTML, chaque morceau de texte correspondant
     * à un ingrédient est mis dans une balise SPAN
     * avec la classe "ingredient" et la classe correspondant
     * au nom de l'ingrédient.
     */	

	// Utilisation de jQuery pour écouter l'événement "mouseenter"
	// sur les balises qui possèdent la classe "ingredient"
	$('.ingredient').on('mouseenter',function(event) {
		// Pour chaque ingrédient de la liste, on regarde si
		// l'ingrédient survolé correspond à cet ingrédient
		annotations['ingredient'].forEach(function(ing) {
				if( $(this).hasClass(ing) ) {
					// Si c'est le cas, on ajoute la classe
					// "ingredient-hover" -> le reste se passe
					// dans les CSS
					$('.'+ing).addClass('ingredient-hover');
				}
		},this);
		return false;
	});

	$('.ingredient').on('mouseleave',function(event) {
		// Pour chaque ingrédient de la liste, on regarde si
		// l'ingrédient survolé correspond à cet ingrédient
		annotations['ingredient'].forEach(function(ing) {
				if( $(this).hasClass(ing) ) {
					// Si c'est le cas, on retire la classe
					// "ingredient-hover" -> le reste se passe
					// dans les CSS
					$('.'+ing).removeClass('ingredient-hover');
				}
		},this);
		return false;
	});


}


function init() {
	$("#file_input").on("change",load_file)

}



$(window).load(init);



