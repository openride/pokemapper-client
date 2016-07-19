function getSightingsLayer(id, source) {
  return {
    id: id,
    source: source,
    type: 'circle',
    paint: {
      'circle-color': {
        property: 'type',
        type: 'categorical',
        stops: [
          ['normal', '#A8A878'],
          ['fighting', '#C03028'],
          ['flying', '#A890F0'],
          ['poison', '#A040A0'],
          ['ground', '#E0C068'],
          ['gock', '#B8A038'],
          ['bug', '#A8B820'],
          ['ghost', '#705898'],
          ['steel', '#B8B8D0'],
          ['fire', '#F08030'],
          ['water', '#6890F0'],
          ['grass', '#78C850'],
          ['electric', '#F8D030'],
          ['psychic', '#F85888'],
          ['ice', '#98D8D8'],
          ['dragon', '#7038F8'],
          ['dark', '#705848'],
          ['fairy', '#EE99AC'],
        ]
      },
      'circle-radius': {
        "stops": [
          [1, 3],
          [5, 4],
          [16, 16]
        ],
        base: 1,
      },
      // 'circle-opacity': 0.7,
    },
  };
}

function positionThing(position) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            position.coords.longitude,
            position.coords.latitude,
          ],
        },
        properties: {
          role: 'outline'
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            position.coords.longitude,
            position.coords.latitude,
          ],
        },
        properties: {
          role: 'fill'
        }
      },
    ]
  };
}
function getMedotLayer(id, source) {
  return {
    id: id,
    source: source,
    type: 'circle',
    paint: {
      'circle-color': {
        property: 'role',
        type: 'categorical',
        stops: [
          ['outline', '#fff'],
          ['fill', '#24f'],
        ],
      },
      'circle-radius': {
        property: 'role',
        type: 'categorical',
        stops: [
          ['outline', 12],
          ['fill', 9],
        ],
      },
      'circle-opacity': 1,
    },
  }
}


function getNewSightingLayer(id, source) {
  return {
    id: id,
    source: source,
    type: 'circle',
    paint: {
      'circle-color': '#f36',
      'circle-radius': 16,
      'circle-opacity': 1,
    },
  }
}
