// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as  recipeView from './views/recipeView';
import * as searchView from './views/searchView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements,renderLoader,clearLoader } from "./views/base";

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */

const state = {};


/**
 * SEARCH CONTROLLER
 * @returns {Promise<void>}
 */

const controlSearch = async () => {
    // 1 Get query from view
    const query = searchView.getInput();

    if (query) {
        // 2 New search object and add to state
        state.search = new Search(query);

        //3 Prepare UI for results
        searchView.clearInput();
        searchView.clearResult();
        renderLoader(elements.searchRes);
        try{
            //4. Search for recipes
            await state.search.getResults();

            //5. Render results on UI
            clearLoader();
            searchView.renderResult(state.search.result);
        }catch (e) {
            alert('Something went wrong with the search...');
        }

    }

};

elements.searchForm.addEventListener('submit', e => {
   e.preventDefault();
   controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto,10);
        searchView.clearResult();
        searchView.renderResult(state.search.result,goToPage);
    }
});

/**
 *  RECIPE CONTROLLER
 *
 * @type {Recipe}
 */

const controlRecipe = async () => {
    //Get the ID for URL
    const id = window.location.hash.replace('#','');

    if (id) {
        //Prepare the UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if (state.search) searchView.highlightSelected(id);

        //Create new recipe object
        state.recipe = new Recipe(id);
        try {
            //Get the recipe data and parse ingredient
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //Calculate serving and time
            state.recipe.calcServings();
            state.recipe.calcTime();
            //Render recipe
            clearLoader();
            console.log(state.recipe);
            recipeView.renderRecipe(state.recipe,state.like.isLiked(id));
        }catch (e) {
            // console.log(e);
            alert('Error processing recipe!');
        }

    }
};

['hashchange','load'].forEach(event => window.addEventListener(event,controlRecipe));

/**
 * LIST CONTROLLER
 */

const controlList = () => {
    //Create a new list if there is none
    if(!state.list) state.list = new List();

    //Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
       const item = state.list.addItem(el.count,el.unit,el.ingredient);
       listView.renderItem(item);
    });
};

const controlLike = () => {
    if (!state.like) state.like = new Likes();
    const currentID = state.recipe.id;
    
    if (!state.like.isLiked(currentID)){
        const newLike = state.like.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        likesView.toggleLikeBtn(true);

        likesView.renderLike(newLike);
    } else{
        state.like.deleteLike(currentID);

        likesView.toggleLikeBtn(false);

        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.like.getNumLikes());
};

//Handle delete and update list item events

elements.shopping.addEventListener('click',e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {

        state.list.deleteItem(id);

        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value,10);

        state.list.updateCount(id,val);
    }
});


//Handling recipe button clicks
elements.recipe.addEventListener('click',e => {
    if (e.target.matches('.btn-decrease,.btn-decrease *')) {
        if (state.recipe.serving > 1) {
            state.recipe.updateServing('dec');
            recipeView.updateServingsIngredient(state.recipe);
        }
    }else if (e.target.matches('.btn-increase,.btn-increase *')) {
        state.recipe.updateServing('inc');
        recipeView.updateServingsIngredient(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        controlLike();
    }
});

window.addEventListener('load',() => {

    state.like = new Likes();

    state.like.readStorage();

    likesView.toggleLikeMenu(state.like.getNumLikes());

    state.like.likes.forEach(like => likesView.renderLike(like));
});