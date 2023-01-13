const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const cron = require("node-cron");

async function scrapeData() {
  const browswer = await puppeteer.launch();
  const page = await browswer.newPage();
  await page.goto("https://learnwebcode.github.io/practice-requests/");
  // URL로 가서 스크린샷 찍기 (full page property가 없으면 viewport 기준으로 찍음)
  // await page.screenshot({ path: "ellie_fullPage.png", fullPage: true });

  /**
   * page.evaluate()
   * evalutate 함수 내부에서는
   * 모든 클라이언트단에서 사용하는 자바스크립트 문법을 사용할 수 있다.
   * 하지만 여긴 browser단이지 node단이 아니므로
   * 만약 console.log등을 한다면 node에서 확인할 수 없고 chrome 브라우저에서 확인해야한다
   */

  const names = await page.evaluate(() => {
    // 정확히는 배열이 아니라 nodelist elements를 리턴하므로
    // spread operator 또는 Array.from을 이용해 배열로 만들어준뒤
    // 자바스크립트 배열 메소드를 사용한다
    return [...document.querySelectorAll(".info strong")].map(
      (x) => x.textContent
    );
  });

  // names.json이라는 파일 내부에 각각 return in new line하라
  await fs.writeFile("names.json", names.join("\r\n"));

  /**
   * trigger click event of id: clickme
   */

  await page.click("#clickme");

  /**
   * page.$eval()
   * specifically designed for the purpose of
   * selecting a single element
   */

  const clickedData = await page.$eval("#data", (el) => el.textContent);
  console.log(clickedData);

  /**
   * page.type(selector, word)
   * typing word to the element of the given selector
   * page.click(selector)
   * clicking button of given selector
   * page.waitForNavigation()
   * wait for navigating another page
   */

  await page.type("#ourfield", "blue");
  await Promise.all([page.click("#ourform button"), page.waitForNavigation()]);

  const info = await page.$eval("#message", (el) => el.textContent);
  console.log(info);

  /**
   * page.$$eval()
   * specifically designed for the purpose of
   * selecting multiple elements
   */
  const photos = await page.$$eval("img", (imgs) => {
    // pass elements to our func
    // here params are an actual array not nodelists

    return imgs.map((x) => x.src);
  });

  // not forEach but for - of ~ : it allows for the await syntax!!!
  for (const photo of photos) {
    const imagePage = await page.goto(photo);
    await fs.writeFile(
      `images/${photo.split("/").pop()}`,
      await imagePage.buffer()
    );
  }

  // Close시키지 않으면 영원히 끝나지 않음..! 필수
  await browswer.close();
}

scrapeData();

// automate scraping per 5secs

// naive way
setInterval(scrapeData, 5000);

// more sophisticated way
cron.schedule("*/5 * * * * *", scrapeData);
