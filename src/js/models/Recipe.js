import axios from 'axios';

export default class Recipe {

    constructor(id){
        this.id = id;
    }

    async getRecipe(){
        try {
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            // console.log(res);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.img = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;


        }catch (e) {
            console.log(e);

        }
    }

    calcTime(){

        const numImg = this.ingredients.length;
        const periods = Math.ceil(numImg / 3);
        this.time = periods * 15;
    }

    calcServings(){
        this.serving = 4;
    }

    parseIngredients(){

        const unitLong = ['tablespoons','tablespoon','ounces','ounce','teaspoons','teaspoon','cups','pounds'];
        const unitShort = ['tbsp','tbsp','oz','oz','tsp','tsp','cup','pound'];
        const units = [...unitShort,'kg','g'];

        const newIngredients = this.ingredients.map(el => {
            // 1) Uniform units
            let ingredient = el.toLowerCase();
            unitLong.forEach((unit,i) => {
               ingredient = ingredient.replace(unit,unitShort[i]);
            });

            //2) Remove parentheses
            ingredient = ingredient.replace(/ *\([^)]*\) */g,' ');

            // 3) Parse ingredients into count, unit and ingredient
            const arrIng = ingredient.split(' ');
            const unitIndex = arrIng.findIndex(els => units.includes(els));

            // console.log(unitIndex);

            let objIng;
            if (unitIndex > -1){
                //There is a unit
                //ex. 1/2 cups, arrCount is [4,1/2] --> eval("4+1/2") --> 4.5
                //ex. 4 Cups is 4
                const arrCount = arrIng.slice(0,unitIndex);
                let count;

                if (arrCount.length === 1){
                    count = eval(arrIng[0].replace('-','+'));
                } else {
                    count = eval(arrIng.slice(0,unitIndex).join('+'));
                }

                objIng = {
                    count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(' ')
                }
            } else if(parseInt(arrIng[0],10)) {
                //There is no unit, but 1st element is a number
                objIng = {
                    count:parseInt(arrIng[0],10),
                    unit: '',
                    ingredient:arrIng.slice(1).join(' ')
                }
            }else if(unitIndex === -1){
                //There is no unit and no number in 1st position
                objIng = {
                  count:1,
                  unit:'',
                  ingredient
                };
            }

            return objIng;

        });
        this.ingredients = newIngredients;
    }

    updateServing(type){
        const newServings = type === 'dec' ? this.serving - 1 : this.serving + 1;

        this.ingredients.forEach(ing => {
           ing.count *= (newServings / this.serving);
        });

        this.serving = newServings;
    }

}