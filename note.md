//pages
{
"pages":[
{
"components": [
{
"type": "card",
"title": "១. ព័ត៌មាននៃមនុស្ស",
"options": {
"columns": {
"\_": 24,
"md": 12,
"lg": 12
}
},
"components": [
{
"type": "text"
"required": true,
"requireRule": [
{
"field": "licenseeType",
"operator": "eq",
"value": "INDIVIDUAL"
}
],
"visibilityRule": [
{
"field": "isOwner",
"operator": "eq",
"value": "false"
}
]
},
]
}
]
}
]

}

//Address
build components and make type for it
