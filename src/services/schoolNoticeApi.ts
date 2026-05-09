const BASE_URL = "http://192.168.1.75:8080";

export type CreateSchoolNoticeRequest = {
    schoolId: number;
    title: string;
    message: string;
    noticeType: string;
    createdByRole: string;
    createdByUserId: number;
};

export async function createSchoolNotice(payload: CreateSchoolNoticeRequest) {
    const response = await fetch(`${BASE_URL}/school-notices`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create school notice");
    }

    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}