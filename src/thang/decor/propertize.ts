/**
 * generates chain functions.
 * 
 * see Thext.$text for example - how its empty function is filled by this decorator.
 * 
 * @param target 
 */
export const _CH_PRE = "$";
export function CH_F(target: any) {
    const proto = target.prototype;
    const clName = target.name;
    const clProps = Object.getOwnPropertyDescriptors(proto);
    // console.log({ target, classPrototype, classProps });


    Object.keys(clProps).forEach((propName) => {

        const prop = clProps[propName];
        const getName = (prop.get?.name || ``).cutFirst(`get `);
        // console.log({ propName, prop });
        // console.log(`"${getName}".startsWith(${PRE}) =`, getName.startsWith(PRE));

        if (!prop.get || !getName.startsWith(_CH_PRE)) {
            return;
        }

        const accName = getName.slice(_CH_PRE.length);
        if (!proto[accName]) {
            throw new Error(`You need to create an empty "${clName}.${accName}", so I can base it on "${getName}" your getter.`);
            return;
        }

        proto[accName] = function (value?: any) {
            if (value !== undefined)
                this[propName] = value;
            return this;// I want to return the Thang, so I can chain the calls
        };
    });

}
/////////////