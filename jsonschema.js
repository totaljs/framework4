require('./index');

function compile(builder, schema) {

	var properties = schema.properties;

	for (var key in properties) {

		var type = properties[key];

		// type.contentEncoding
		// type.contentMediaType
		// type.contentSchema

		// response {Object}
		// obj {Object}
		// notempty

		builder.push('skip=false;key="' + key + '";');
		builder.push('val=obj[key];');

		var isrequired = schema.required ? schema.required.indexOf(key) !== -1 : false;
		switch (type.type) {
			case 'integer':
			case 'number':

				builder.push('type=typeof(val);if(type==="string"){val=val.parseFloat()}else if(type!=="number"){val=undefined}');

				if (isrequired)
					builder.push('if(val==null){error.push(key,"required");skip=true;}');

				if (type.multipleOf)
					builder.push('if(!skip&&val%' + type.multipleOf + '!==0){error.push(key,"multipleof");skip=true;}');

				if (type.maximum)
					builder.push('if(!skip&&val>' + type.maximum + '){error.push(key,"maximum");skip=true;}');

				if (type.exclusiveMaximum)
					builder.push('if(!skip&&val>=' + type.exclusiveMaximum + '){error.push(key,"exclusivemaximum");skip=true;}');

				if (type.minimum)
					builder.push('if(!skip&&val<' + type.minimum + '){error.push(key,"minimum");skip=true;}');

				if (type.exclusiveMinimum)
					builder.push('if(!skip&&val<=' + type.exclusiveMinimum + '){error.push(key,"exclusiveminimum");skip=true;}');

				builder.push('if(!skip)response[key]=val;');
				break;

			case 'boolean':
			case 'bool':

				builder.push('type=typeof(val);if(type!=="boolean"){val=val?(val+"").parseBoolean():false}');

				if (isrequired)
					builder.push('if(!val){error.push(key,"required");skip=true;}');

				builder.push('if(!notempty||val){response[key]=val}');
				break;

			case 'date':

				builder.push('if(!(val instanceof Date)){val=val?(val+"").parseDate():undefined}');
				builder.push('if(val && val instanceof Date && !(val.getTime()>0)){val=undefined}');

				if (isrequired)
					builder.push('if(!val){error.push(key,"required");skip=true;}');

				builder.push('if(!notempty||val){response[key]=val}');
				break;

			case 'object':

				// type.maxProperties
				// type.minProperties
				// type.required
				// type.dependentRequired

				builder.push('if(val&&typeof(val)==="object"){');
				var id = GUID(5);
				var tmpres = 'response' + id;
				var tmpobj = 'obj' + id;
				var tmpkey = 'key' + id;
				builder.push('var ' + tmpres + '=response,' + tmpobj + '=obj,' + tmpkey + '=key;obj=obj[key]||EMPTYOBJECT;response={};');
				compile(builder, type);
				builder.push(tmpres + '[' + tmpkey + ']=response;');
				builder.push('obj=' + tmpobj + ';');
				builder.push('}' + (isrequired ? 'else{error.push(key,"required")}' : ''));
				break;

			case 'string':

				builder.push('type=typeof(val);if(type!=="string"){val=val?val+"":""}');

				if (isrequired)
					builder.push('if(!val){error.push(key,"required");skip=true;}');

				if (type.maxLength)
					builder.push('if(!skip&&val.length>' + type.maxLength + '){error.push(key,"maxlength");skip=true;}');

				if (type.minLength)
					builder.push('if(!skip&&val.length<' + type.minLength + '){error.push(key,"minlength");skip=true;}');

				// @TODO: implement "type.pattern"
				builder.push('if(!notempty||val){response[key]=val}');
				break;
		}
	}
}

var schema = {
"required": [ "familyName", "givenName" ],
"properties": {
    "fn": {
      "description": "Formatted Name",
      "type": "string"
    },
    "familyName": {
      "type": "string"
    },
    "givenName": {
      "type": "string"
    },
    "additionalName": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "honorificPrefix": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "honorificSuffix": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "nickname": {
      "type": "string"
    },
    "url": {
      "type": "string"
    },
    "email": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      }
    },
    "tel": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      }
    },
    "tz": {
      "type": "string"
    },
    "photo": {
      "type": "string"
    },
    "logo": {
      "type": "string"
    },
    "sound": {
      "type": "string"
    },
    "bday": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "role": {
      "type": "string"
    },
    "org": {
      "type": "object",
      "required": ["organizationUnit"],
      "properties": {
        "organizationName": {
          "type": "string"
        },
        "organizationUnit": {
          "type": "string"
        }
      }
    }
  }
};

var builder = ['var skip,key,val'];
compile(builder, schema);
// console.log(builder);

var fn = new Function('error', 'response', 'obj', 'notempty', builder.join('\n'));
var data = { familyName: 'Peter', givenName: 'Širka', org: { organizationName: 'Total Avengers s.r.o.', organizationUnit: 'IT department' }};
var err = new ErrorBuilder();
var response = {};
fn(err, response, data, true);

if (err.is)
	console.log(err);
console.log(response);
