export namespace models {
	
	export class Credential {
	    id: string;
	    project_id: string;
	    label: string;
	    type: string;
	    subtype: string;
	    username?: string;
	    secret?: string;
	    metadata?: Record<string, string>;
	    tags?: string[];
	    source?: string;
	    valid: boolean;
	    // Go type: time
	    created_at: any;
	    operator?: string;
	
	    static createFrom(source: any = {}) {
	        return new Credential(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.project_id = source["project_id"];
	        this.label = source["label"];
	        this.type = source["type"];
	        this.subtype = source["subtype"];
	        this.username = source["username"];
	        this.secret = source["secret"];
	        this.metadata = source["metadata"];
	        this.tags = source["tags"];
	        this.source = source["source"];
	        this.valid = source["valid"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.operator = source["operator"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Project {
	    id: string;
	    name: string;
	    type: string;
	    description?: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.description = source["description"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

