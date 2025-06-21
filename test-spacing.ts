// This should be flagged as an error
interface BadSpacing {
  entryPoints?: string[];
  name?: string;
}

// This should be correct
interface GoodSpacing {
  entryPoints?: string[];
  name?: string;
}