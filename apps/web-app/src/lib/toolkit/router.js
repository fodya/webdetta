import frameorcRenderer from '../router/frameorc-adapter.js';
import PagesRenderer from '../router/pages-renderer.js';
import {hashRouter, pathRouter} from '../router/index.js';

const Pages = (router, list) => PagesRenderer(router, frameorcRenderer, list);

export default { Pages, hashRouter, pathRouter };
