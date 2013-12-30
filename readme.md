Prototype d'interface d'annotation de recettes
==============================================

Principes
---------

Ce prototype contient deux interfaces :
1. Une interface de visualisation de recette annotée
2. Une interface d'édition de recette (avec possibilité 
d'annotations)

### Interface de visualisation de recettes

Pour tester la première interface, il suffit d'ouvrir le 
document index.html dans un navigateur web.
Ensuite, il faut charger un fichier de recette au format 
json (par exemple, le fichier "quiche lorraine.json").

Dans cette interface, le fichier json est parsé pour 
afficher la recette. Les annotations des ingrédients (et 
des ustensiles) sont prises en compte : en survolant la 
recette, les termes annotés apparaissent surlignés (en rose
pour les ingrédients et en vert pour les ustensiles).

Lorsqu'un ingrédient est survolé (que ce soit dans la liste
d'ingrédients ou dans le texte de préparation, les autres
instances de cet ingrédient sont aussi surlignées).

Enfin, lorsqu'un élément annoté est surligné, deux icônes
apparaissent : une pour éditer le mot annoté (par ex., 
remplacer un ingrédient par un autre), l'autre pour ajouter
un commentaire associé spécifiquement à ce mot annoté.
Dans cette version du prototype, aucune de ces deux 
fonctionnalités n'est implémentée.

### Interface d'édition de recettes

Pour tester la première interface, il suffit d'ouvrir le 
document input-recipe.html dans un navigateur web.

Un formulaire de saisie de recette apparaît alors.
En dehors des classiques champs de saisie des 
méta-informations, les ingrédients sont saisis un par un
dans un formulaire contenant trois champs texte : le premier
pour les quantités, le deuxième pour les unités et le 
dernier pour le nom de l'ingrédient.
Enfin, un champ permet de saisir la préparation de la
recette.

L'originalité de cette interface réside dans le fait que
la saisie des ingrédients est autocomplétée (une liste
d'ingrédients correspondant à ce que l'utilisateur saisit
est proposée).
Cela s'applique dans le champ ingrédient, mais aussi dans
le champ préparation. Notons que lors de la saisie de la
préparation de la recette, les ustensiles peuvent être aussi
proposés à l'autocomplétion, ainsi que des termes non liés à
une annotation.

Deuxième originalité de cette interface, l'ajout d'un 
ingrédient non existant dans la liste des propositions dans
le champ ingrédient rend cet ingrédient disponible à
l'annotation dans le champ de saisie de la préparation.
Par exemple, si l'on ajoute l'ingrédient "carotte", alors, 
lors de la saisie du mot carotte dans le champ de 
préparation de la recette, le mot carotte sera proposé en 
temps qu'ingrédient.

Dernière originalité, la saisie d'un ingrédient dans 
l'interface de saisie de la préparation ajoute 
automatiquement cet ingrédient à la liste des ingrédients
s'il n'était pas déjà présent. Cela permet de faciliter la 
saisie de la recette.

Enfin, l'ensemble de la recette peut être sauvegardée au
format json, pour être ensuite chargée dans l'interface de
visualisation de la recette.



Sources
-------

Le code de ce prototype est disponible sous licence MIT.

1. Plusieurs bibliothèques externes sont utilisées :
  - jQuery (licence MIT)
  - typeahead.js (bibliothèque Javascript pour l'autocomplétion) (licence Apache v2.0)
  - Hogan.js (moteur de template Javascript) (licence MIT)

2. Le code suivant a été adapté pour la génération (et la
sauvegarde) du fichier json depuis l'interface Javascript :
(voir http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server)
	var a = window.document.createElement('a');
	a.href = window.URL.createObjectURL(new Blob(['Test,Text'], {type: 'text/csv'}));
	a.download = 'test.csv';

	// Append anchor to body.
	document.body.appendChild(a)
	a.click();

	// Remove anchor from body
	document.body.removeChild(a)

3. Les icônes utilisées dans l'interface de visualisation de 
recette sont sous licence creative commons (©Mark James
http://www.famfamfam.com/lab/icons/silk/), voir fichier
images/readme.txt pour plus de détails.

