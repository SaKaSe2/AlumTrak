import PDDikti from "@x403/pddikti";

async function test() {
  const pddikti = new PDDikti({ cacheEnabled: false });
  const names = ["Yuli Ika Yanti", "Assa Idhika", "Hery Purwanto"];
  
  for (const name of names) {
    console.log(`\nSearching for: ${name}`);
    try {
      const students = await pddikti.search.students({ name });
      console.log(`Found: ${students?.length || 0}`);
      
      const ummResults = students?.filter(
        (m) =>
          m.campusName?.toUpperCase().includes("MUHAMMADIYAH MALANG") ||
          m.campusShortName?.toUpperCase() === "UMM"
      ) || [];
      
      console.log("UMM matches:", ummResults.length);
      if(ummResults.length > 0) {
        console.log(ummResults.slice(0, 2));
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

test().catch(console.error);
