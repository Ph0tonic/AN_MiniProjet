# AN_MiniProjet
Algorithmes Numériques - Mini-Projet

## Auteur
- Bastien Wermeille

## Date
- Juin 2018

# Description
Ce projet a pour but la simulation du comportement simpliste des fourmis afin de voir comment le comportement « simpliste » de nombreuses fourmis peut mener à une intelligence de groupe avec une efficacité redoutable. L’idée générale du projet était d’essayer de restituer au mieux le comportement des fourmis. La première étape de ce projet a été la recherche sur le comportement des fourmis afin de comprendre celles-ci agissent, la littérature scientifique utilisée est référencée sur la page HTML du simulateur.

Le comportement « simpliste » d’une fourmi qui a été implémentée dans ce projet se base sur deux idées largement acceptées et prouvées par les scientifiques. La première est que les fourmis sont capables en tout temps de situer la position de la fourmilière en gardant en mémoire la distance parcourue et dans quelle direction. La seconde se base sur le système de phéromones laissées par les fourmis lors de leur retour à la fourmilière avec de la nourriture. Le principe est simple, lorsqu’une fourmi trouve de la nourriture et qu’elle revient à la fourmilière, elle laisse des phéromones dernières, à savoir qu’il existe plusieurs types de phéromones. Dans notre situation, les fourmis émettent des phéromones de traces qui sont en l’occurrence des hydrocarbures non volatils. Les fourmis détectant ces phéromones par hasard sont ainsi capables de suivre la piste des phéromones et vont aller dans la direction inverse à laquelle la concentration de phéromone est la plus grande.

Une fois la littérature scientifique trouvée, je suis passée à la phase de réalisation ou j’ai exploité ces deux principes de base. Les fourmis agissent donc de la manière suivante :
1.    Déplacement de manière aléatoire
2.    Si des phéromones sont détectées, ils les suivent
3.    Si de la nourriture est trouvée, elles rentrent à la fourmilière en laissant des phéromones derrière elles.

Lors des nombreuses simulations effectuées, on peut ainsi voir les fourmis se déplaçant de manière aléatoire puis lorsqu’une fourmi trouve de la nourriture, elle rentre en laissant une trace de phéromone derrière elle. Cette seule trace de phéromone est ensuite détectée par de nombreuses autres fourmis qui la suivent et laissent à leurs tours une trace derrière elles. Le système est lancé et la nourriture est ainsi amenée au nid de manière continue, jusqu’à ce qu’il n’y ait plus de nourriture. Le simulateur permet de lancer la simulation sans phéromone et offre ainsi un exemple concret du manque d'efficacité sans l’utilisation des phéromones.
