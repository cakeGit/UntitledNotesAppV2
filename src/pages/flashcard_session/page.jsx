import { useRef, useState } from "react";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import { fetchApi } from "../../foundation/api.js";
import { useApi } from "../../foundation/useApiData.js";
import "./style.css";
import { FlashcardSelfAssessTask } from "./tasks/SelfAssessTask.jsx";
import { FlashcardMultiChoiceTask } from "./tasks/MultiChoiceTask.jsx";
import { generateMultiChoiceOptions } from "./multichoiceHelper.mjs";

function getFlashcardPriority(flashcard) {
    const l1 = flashcard.learningHistory1 || 0;
    const l2 = flashcard.learningHistory2 || 0;
    const l3 = flashcard.learningHistory3 || 0;
    const l4 = flashcard.learningHistory4 || 0;

    const now = Date.now();
    const lastLearnedTime = flashcard.lastLearnedTime || 0;
    const daysSinceLastLearned =
        (now - lastLearnedTime) / (1000 * 60 * 60 * 24);

    return (
        1 -
        (l1 * 2 + l2 * 1.5 + l3 * 1.25 + l4) / 12 +
        Math.pow(1.05, daysSinceLastLearned)
    );
}

/**
 * Get a 'Bundle' of the next 10 flashcards to learn
 */
function getNextFlashcardBundle(flashcards, includeMultiChoiceData) {
    if (flashcards.length === 0) {
        throw new Error("No flashcards available to build a flashcard bundle");
    }

    //Apply in the flashcard priority
    flashcards.forEach((flashcard) => {
        flashcard.priority = getFlashcardPriority(flashcard); //Note that unlearned flashcards will have a priority of infinity
    });
    flashcards.sort((a, b) => b.priority - a.priority);
    
    let nextUnlearnedCard = null;
    let flashcardBundle = [];
    //Skip unlearned cards from the top but keep track of the first one, and then fill in the rest of the bundle with learned cards
    for (let i = 0; i < flashcards.length; i++) {
        const flashcard = flashcards[i];
        if (!flashcard.lastLearnedTime) {
            if (!nextUnlearnedCard) {
                nextUnlearnedCard = flashcard;
            }
            continue;
        }
        flashcardBundle.push(flashcard);
        if (flashcardBundle.length >= 10) {
            break;
        }
    }

    let unlearnedCardIncluded = false;
    //If flashcardBundle has less than 10 cards, we can go back and add unlearned cards
    if (flashcardBundle.length < 10 && nextUnlearnedCard) {
        for (let i = flashcardBundle.length; i < 10; i++) {
            if (!flashcards[i] || flashcards[i].priority !== Infinity) break;
            flashcardBundle.push(flashcards[i]);
            unlearnedCardIncluded = true;
        }
        //If the length is still lower, repeat the cards
        if (flashcardBundle.length < 10) {
            let i = 0;
            while (flashcardBundle.length < 10) {
                flashcardBundle.push(
                    flashcardBundle[i],
                );
                i++;
            }
        }
    }

    //Check the lowest priority of the learned cards in the bundle, and see if its less than 0.90,
    //If so, check a random number (so we maintain close to the 5% target of unlearned cards in sessions
    if (flashcardBundle[flashcardBundle.length - 1].priority < 0.9 && !unlearnedCardIncluded && Math.random() < 0.05) {
        //Replace the last card with the next unlearned card
        flashcardBundle[flashcardBundle.length - 1] = nextUnlearnedCard;
    }

    flashcardBundle = structuredClone(flashcardBundle); //Deep clone to avoid mutating the original data if we add multi choice data

    //If multi choice mode, generate the additional data needed
    for (const flashcard of flashcardBundle) {
        if (includeMultiChoiceData) {
            flashcard.multiChoiceOptions = generateMultiChoiceOptions(flashcard, flashcards);
        }
    }
    console.log("Final flashcard bundle with multi choice data:", flashcardBundle);
    return flashcardBundle;
}

function BuildPage() {
    //Get selected pages
    const selectedPageIds = JSON.parse(
        sessionStorage.getItem("flashcard_session_selected_page_ids"),
    );
    const sessionOption = sessionStorage.getItem("flashcard_session_option") || "self_assess";
    const includeMultiChoiceData = sessionOption == "multi_choice";

    const [activeFlashcard, setActiveFlashcard] = useState(null);
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const activeFlashcardBundleRef = useRef(null);
    const flashcardLearningUpdatesRef = useRef([]);

    const { data, loading, error } = useApi(async () => {
        const response = await fetchApi(
            "flashcards/get_flashcards_information_of_pages",
            {
                pageIds: selectedPageIds,
            },
        );

        return response.flashcards;
    });
    if (loading || error) return <></>;
    console.log(data);

    activeFlashcardBundleRef.current = activeFlashcardBundleRef.current || getNextFlashcardBundle(data, includeMultiChoiceData);
    if (!activeFlashcard) setActiveFlashcard(activeFlashcardBundleRef.current[0]);

    const advanceToNextFlashcard = (difficulty) => {
        console.log("Completed flashcard with difficulty:", difficulty);
        //Update the flashcard learning history locally, we bundle actually uploading the results later
        const flashcard = activeFlashcardBundleRef.current.shift();
        flashcardLearningUpdatesRef.current.push({
            flashcardLinkId: flashcard.flashcardLinkId,
            difficulty
        });
        if (!flashcard) {
            //We need a new bundle if we're still going (temp dev: infinite flashcards no stoppping)
            activeFlashcardBundleRef.current = getNextFlashcardBundle(data, includeMultiChoiceData);
        };
        console.log(activeFlashcardBundleRef.current);
        setFlashcardIndex(flashcardIndex + 1);
        setActiveFlashcard(activeFlashcardBundleRef.current[0]);
        console.log("Changed active flashcard to:", activeFlashcard, flashcardIndex + 1);
    };
    const TaskComponent = {
        self_assess: FlashcardSelfAssessTask,
        multi_choice: FlashcardMultiChoiceTask
    }[sessionOption];
    return (
        <PageCenterContent>
            <h1>Flashcard revision session</h1>
            <TaskComponent flashcard={activeFlashcard} onComplete={advanceToNextFlashcard} key={flashcardIndex}/>
            <div className="flashcard_session_progress_bar"
            style={{
                width: "100%",
                height: "20px",
                backgroundColor: "#ddd",
                marginTop: "20px",
            }}>
                <div
                    className="flashcard_session_progress_bar_fill"
                    style={{
                        width: `${100 * (flashcardIndex / 30)}%`,
                        height: "100%",
                        backgroundColor: "#4caf50", //TEMP I SWEAR
                    }}
                ></div>
            </div>
        </PageCenterContent>
    );
}

export default BuildPage;
